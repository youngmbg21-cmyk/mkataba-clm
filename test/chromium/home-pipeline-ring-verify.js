/* Chromium verification: THE PIPELINE CARD IS A RING AND ONE LIST
   ============================================================
   Owner's call, 13 Aug 2026. The card drew three scrolling columns; each was a
   third of the card wide, so a contract's name was cut off mid-word on every
   row and the shape of the book had to be read off three separate counts. It
   is a ring on two thirds and one list on one third now.

   THE OWNER'S ONE STANDING CONDITION, AND WHY IT NEEDS A BROWSER:

     "The heights of the cards have changed when they were supposed to stay the
      same. Only the content inside the card should change."

   The card's height is not a number in the source — .hm-main-row hands it
   whatever is left after the hero and the metrics, and Decisions due beside it
   is filled to match. So "the card did not change size" is a claim about laid
   out pixels and cannot be made anywhere but a browser. Every check below is a
   measured rectangle:

     · the card is exactly as tall as Decisions due, at four window sizes;
     · pressing every stage moves NOTHING — not the card, not one of the ~200
       elements around it — while the contents genuinely change;
     · nothing inside the card paints outside it, and nothing is clipped away;
     · the ring is sized FROM the card, so a short window shrinks the chart
       rather than growing the card.

   AND THE TYPE IS THE APP'S. The figure in the middle of the ring must be set
   in --font-heading, the workspace's own face, not a stack invented for a
   mockup.

   Run: node test/chromium/home-pipeline-ring-verify.js */
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const { chromium } = require('playwright-core');

const ROOT = path.join(__dirname, '..', '..');
const OUT = path.join(__dirname, 'shots', 'home-pipeline-ring');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

/* The dashboard's own module graph, loaded as the product loads it. */
const SCRIPTS = ['i18n', 'jurisdiction', 'components', 'templates', 'core', 'workshape',
  'richdoc', 'clausemodel', 'redline', 'docx', 'versioning', 'discuss', 'negotiation',
  'family', 'metadata', 'obligations', 'approvals', 'review', 'desk', 'playbook',
  'signature', 'aimd', 'aichart', 'ai', 'views/register', 'views/calendar',
  'views/contract', 'views/negotiation', 'views/portal', 'views/home'];

/* The shell stood in for: #content-scroll is what --view-h is measured from,
   and .hm-page is exactly that tall. Get this wrong and the card's height is
   the harness's invention rather than the product's. */
const HARNESS = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>pipeline</title></head><body>
<div id="app-shell"></div><div id="modal-root"></div><div id="print-root"></div><div id="share-root"></div>
<script>
(function(){ var x=new XMLHttpRequest(); x.open('GET','/index.html',false); x.send(null);
  var d=new DOMParser().parseFromString(x.responseText,'text/html');
  Array.prototype.forEach.call(d.querySelectorAll('style'),function(s){
    var e=document.createElement('style'); e.textContent=s.textContent; document.head.appendChild(e); });
  /* The Copilot panel is lifted in with the stylesheet: js/ai.js wires itself
     to #ai-send and friends the moment it loads, and without those nodes the
     page throws before the dashboard is measured. Same reason redline.html
     lifts them. */
  ['ai-scrim','ai-panel','context-panel','cmd-panel'].forEach(function(id){
    var node=d.getElementById(id); if(node) document.body.appendChild(document.importNode(node,true)); });
})();
</script>
<main id="content-scroll" class="scroll-thin" style="position:fixed;left:0;right:0;top:64px;bottom:0;overflow:auto;scrollbar-gutter:stable;">
  <div id="content"></div>
</main>
<script>
window.FIRST_PARTY='Wanjiru Catering Ltd'; window.PORTAL_MODE=false;
try{ localStorage.setItem('hati.v1.users', JSON.stringify([{id:'u_y',name:'Young Mbagaya',role:'admin',email:'y@co.ke'}]));
  localStorage.setItem('hati.v1.session', JSON.stringify({userId:'u_y'})); }catch(e){}
window.API_MODE=()=>false;
</script>
${SCRIPTS.map(s => `<script src="/js/${s}.js"></script>`).join('\n')}
<script>
window.currentUser=()=>({id:'u_y',name:'Young Mbagaya',role:'admin'});
window.canEdit=()=>true; window.isAdmin=()=>true;
window.persist=()=>{}; window.saveContract=()=>{}; window.setView=()=>{};
window.toast=()=>{}; window.setActiveNav=()=>{}; window.updateSidebarCounts=()=>{};
window.selectContract=(id)=>{ window.OPENED=id; };
</script>
<script>
window.READY=(async()=>{
  const sc=document.getElementById('content-scroll');
  document.documentElement.style.setProperty('--view-h', sc.clientHeight+'px');
  state.view='dashboard';
  renderDashboard();
  await new Promise(r=>setTimeout(r,300));
  return true;
})();
</script>
</body></html>`;

function serve(){
  return new Promise(res => {
    const srv = http.createServer((req, rep) => {
      const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
      if (rel === 'pipeline.html'){ rep.writeHead(200, {'Content-Type':'text/html'}); rep.end(HARNESS); return; }
      const file = path.join(ROOT, rel || 'index.html');
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()){ rep.writeHead(404); rep.end('no'); return; }
      rep.writeHead(200, {'Content-Type': MIME[path.extname(file)] || 'application/octet-stream'});
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

/* Every element on the page keyed by a stable path, plus the card's own
   geometry. The path lets two snapshots line up row for row. */
const SNAP = `(() => {
  const card = document.querySelector('.hm-pipe-card');
  const cols = card && card.querySelector('.hm-pipe-cols');
  const dec  = document.querySelector('.hm-decisions');
  const b = el => { if (!el) return null; const r = el.getBoundingClientRect();
    return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; };
  const path = el => { const p = []; let n = el;
    while (n && n !== document.body) { const par = n.parentElement;
      p.unshift(par ? [...par.children].indexOf(n) : 0); n = par; }
    return p.join('/'); };
  const outside = {};
  document.querySelectorAll('#content *').forEach(el => {
    if (cols && cols.contains(el)) return;          // inside the card — free to change
    outside[path(el)] = b(el);
  });
  const list = document.getElementById('hm-list');
  const key  = document.getElementById('hm-key');
  const pane = document.getElementById('hm-pipe-chart');
  const fig  = document.getElementById('hm-fig');
  return {
    outside, n: Object.keys(outside).length,
    card: b(card), decisions: b(dec),
    ring: pane ? getComputedStyle(pane).getPropertyValue('--hm-ring').trim() : null,
    figFont: fig ? getComputedStyle(fig).fontFamily : null,
    headingToken: getComputedStyle(document.documentElement).getPropertyValue('--font-heading').trim(),
    stage: document.querySelector('.hm-side-title') ? document.querySelector('.hm-side-title').textContent.trim() : null,
    figure: fig ? fig.textContent.trim() : null,
    rows: document.querySelectorAll('.hm-row').length,
    segs: document.querySelectorAll('.hm-seg').length,
    keyH: key ? Math.round(key.getBoundingClientRect().height) : null,
    /* Nothing in the card may paint outside it, and nothing in the chart half
       may be clipped away — a hidden key is as bad as one hanging out. */
    spill: card ? Math.max(card.scrollHeight - card.clientHeight, card.scrollWidth - card.clientWidth) : null,
    clipped: pane ? Math.max(pane.scrollHeight - pane.clientHeight, pane.scrollWidth - pane.clientWidth) : null,
    listScrolls: list ? list.scrollHeight > list.clientHeight + 2 : null,
  };
})()`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve();
  const PAGE = `http://127.0.0.1:${srv.address().port}/pipeline.html`;
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    for (const vp of [{ width: 1920, height: 1080 }, { width: 1600, height: 900 },
                      { width: 1440, height: 900 }, { width: 1366, height: 720 }]) {
      const p = await browser.newPage({ viewport: vp, deviceScaleFactor: 1 });
      p.on('pageerror', e => errors.push(`${vp.width}: ${e.message} @ ${(e.stack||'').split('\n')[1]||''}`));
      await p.goto(PAGE, { waitUntil: 'load' });
      await p.evaluate(() => window.READY);
      await p.waitForTimeout(400);

      console.log(`\n---- ${vp.width} x ${vp.height} ----`);
      const first = await p.evaluate(SNAP);

      check(`${vp.width}: the card and Decisions due are the same height`,
        first.card && first.decisions && first.card[3] === first.decisions[3],
        first.card ? `${first.card[3]} vs ${first.decisions[3]}` : 'no card');
      check(`${vp.width}: they share a top edge, 16px apart`,
        first.card[1] === first.decisions[1] && first.decisions[0] - (first.card[0] + first.card[2]) === 16,
        `gap ${first.decisions[0] - (first.card[0] + first.card[2])}px`);
      check(`${vp.width}: the ring is drawn — three segments`, first.segs === 3, `${first.segs} segments`);
      check(`${vp.width}: nothing overflows the card`, first.spill <= 1, `${first.spill}px`);
      check(`${vp.width}: nothing in the chart half is clipped away`, first.clipped <= 1, `${first.clipped}px`);
      check(`${vp.width}: the key is readable, not crushed`, first.keyH >= 60, `${first.keyH}px tall`);

      /* THE TYPE IS THE APP'S OWN. --font-heading is Plus Jakarta Sans here;
         what must never appear is a face this card brought with it. */
      check(`${vp.width}: the ring's figure is set in the app's heading face`,
        first.figFont && first.headingToken
          && first.figFont.replace(/["']/g, '').split(',')[0].trim()
             === first.headingToken.replace(/["']/g, '').split(',')[0].trim(),
        `${first.figFont} vs token ${first.headingToken}`);

      /* THE CLAIM THAT MATTERS. Press every stage, twice round, and re-measure
         the whole page after each press. */
      let moved = null, changed = 0;
      const stages = await p.evaluate(() => [...document.querySelectorAll('.hm-leg')].map(el => el.getAttribute('data-hm-stage')));
      for (const k of [...stages, ...stages].slice(0, 6)) {
        await p.evaluate(s => document.querySelector(`.hm-leg[data-hm-stage="${s}"]`).click(), k);
        await p.waitForTimeout(220);
        const now = await p.evaluate(SNAP);
        if (now.card.join() !== first.card.join()) moved = moved || `card ${now.card.join(',')} after ${k}`;
        if (now.decisions.join() !== first.decisions.join()) moved = moved || `decisions after ${k}`;
        for (const key of Object.keys(first.outside)) {
          const a = first.outside[key], b2 = now.outside[key];
          if (!b2 || a.join() !== b2.join()) { moved = moved || `${key} ${a && a.join(',')} → ${b2 && b2.join(',')} after ${k}`; break; }
        }
        if (now.spill > 1) moved = moved || `spilled ${now.spill}px after ${k}`;
        if (now.stage && now.stage !== first.stage) changed++;
      }
      check(`${vp.width}: PRESSING EVERY STAGE MOVES NOTHING (${first.n} elements watched)`,
        !moved, moved || 'the page held still through six presses');
      check(`${vp.width}: and the contents really did swap`, changed >= 2, `${changed} of 6 presses changed the list`);

      /* Back to the first stage so the screenshot is the default view. */
      await p.evaluate(s => document.querySelector(`.hm-leg[data-hm-stage="${s}"]`).click(), stages[0]);
      await p.waitForTimeout(200);
      if (vp.width === 1920) await p.screenshot({ path: path.join(OUT, '01-1920.png') });
      if (vp.width === 1366) await p.screenshot({ path: path.join(OUT, '02-1366-short.png') });
      await p.close();
    }

    /* ---- AND ONCE THE TWO CARDS STACK, THE PAGE SCROLLS ----
       Below 1200px there is no room for the pipeline card beside Decisions
       due, so the row stacks them — and the page used to refuse to scroll,
       which meant the same leftover height had to be SPLIT between two cards
       instead of shared by two. Decisions due holds a minimum of its own, so
       the pipeline card was the one that gave: 26px at 1024x768, a sliver with
       a slice of chart in it. The three-column card did the same thing before
       this work, so it was never the ring's fault — it was just never fixed.

       A BROWSER IS THE ONLY PLACE THIS CAN BE ASKED. "The page scrolls rather
       than crushing the card" is two laid-out measurements: the card's real
       height, and whether the scroller has more content than room. */
    for (const vp of [{ width: 1024, height: 768 }, { width: 1024, height: 600 }, { width: 960, height: 700 }]) {
      const p = await browser.newPage({ viewport: vp });
      p.on('pageerror', e => errors.push(`${vp.width}x${vp.height}: ${e.message}`));
      await p.goto(PAGE, { waitUntil: 'load' });
      await p.evaluate(() => window.READY);
      await p.waitForTimeout(400);
      const r = await p.evaluate(`(() => {
        const sc = document.getElementById('content-scroll');
        const card = document.querySelector('.hm-pipe-card');
        const dec = document.querySelector('.hm-decisions');
        const cr = card.getBoundingClientRect(), dr = dec.getBoundingClientRect();
        return { cardH: Math.round(cr.height), decH: Math.round(dr.height),
          stacked: Math.round(dr.top) >= Math.round(cr.bottom) - 2,
          scrolls: sc.scrollHeight - sc.clientHeight,
          segs: document.querySelectorAll('.hm-seg').length,
          rows: document.querySelectorAll('.hm-row').length,
          spill: Math.max(card.scrollHeight - card.clientHeight, card.scrollWidth - card.clientWidth) };
      })()`);
      check(`${vp.width}x${vp.height}: the two cards stack`, r.stacked,
        `card ends ${r.cardH}px tall, decisions below`);
      check(`${vp.width}x${vp.height}: THE CARD IS USABLE, NOT A SLIVER`, r.cardH >= 400,
        `${r.cardH}px tall (was 26px before the fix at 1024x768)`);
      check(`${vp.width}x${vp.height}: the page scrolls instead of crushing it`, r.scrolls > 0,
        `${r.scrolls}px of scroll`);
      check(`${vp.width}x${vp.height}: the ring and the list are both drawn`,
        r.segs === 3 && r.rows > 0 && r.spill <= 1, `${r.segs} segments, ${r.rows} rows, ${r.spill}px over`);
      if (vp.width === 1024 && vp.height === 768) await p.screenshot({ path: path.join(OUT, '04-1024-stacked.png') });
      await p.close();
    }

    /* ---- AND A WIDE WINDOW STILL DOES NOT SCROLL ----
       The fix must buy the narrow case without costing the ordinary one: above
       the breakpoint the dashboard still fits on one screen exactly as it did. */
    for (const vp of [{ width: 1920, height: 1080 }, { width: 1440, height: 900 }, { width: 1280, height: 800 }]) {
      const p = await browser.newPage({ viewport: vp });
      await p.goto(PAGE, { waitUntil: 'load' });
      await p.evaluate(() => window.READY);
      await p.waitForTimeout(350);
      const over = await p.evaluate(`(() => { const sc = document.getElementById('content-scroll');
        return sc.scrollHeight - sc.clientHeight; })()`);
      check(`${vp.width}x${vp.height}: a wide window still fits on one screen`, over <= 1, `${over}px of scroll`);
      await p.close();
    }

    /* ---- THE DARK THEME DRAWS IT TOO ---- */
    const dark = await browser.newPage({ viewport: { width: 1600, height: 900 }, colorScheme: 'dark' });
    dark.on('pageerror', e => errors.push('dark: ' + e.message));
    await dark.goto(PAGE, { waitUntil: 'load' });
    await dark.evaluate(() => window.READY);
    await dark.evaluate(() => document.documentElement.classList.add('dark'));
    await dark.waitForTimeout(400);
    const d = await dark.evaluate(SNAP);
    check('dark: the card is still the height of Decisions due',
      d.card[3] === d.decisions[3], `${d.card[3]} vs ${d.decisions[3]}`);
    check('dark: the ring is still drawn and nothing spills',
      d.segs === 3 && d.spill <= 1 && d.clipped <= 1, `${d.segs} segments, ${d.spill}px over`);
    await dark.screenshot({ path: path.join(OUT, '03-dark.png') });
    await dark.close();

    check('no page errors', errors.length === 0, errors.join(' | ') || 'clean');
  } finally {
    await browser.close();
    srv.close();
  }

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) { console.log('FAILED:'); failed.forEach(f => console.log(' - ' + f.name)); }
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
