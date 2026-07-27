/* Chromium verification of the negotiation room.
   ============================================================
   jsdom has no layout engine, so everything visual in this component is tested
   at the RULE level there and has to be confirmed in a real browser here. This
   script renders the room with prototype.html's own six-clause contract
   (clauses 1, 4, 5, 6, 9, 12) and checks it against the prototype:

     · exactly one badge per CHANGED clause, and none on the unchanged ones
     · a real title on every clause — the defect this session exists for
     · unchanged clauses shown clean
     · the redline readable: a rewritten clause is one strikeout and one
       insertion, not interleaved shreds
     · the badge really sits in the margin, outside the text column
     · sync-highlight lighting all three panes at once
     · the Verified pill saying Verified only after the chain is walked

   Every number it prints is measured from getBoundingClientRect, not asserted
   from a stylesheet. Screenshots go to test/chromium/shots/. */
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require('playwright-core');

const http = require('node:http');
const OUT = path.join(__dirname, 'shots');
const ROOT = path.join(__dirname, '..', '..');
const EXEC = '/opt/pw-browsers/chromium';

/* Served over http, not opened as a file://. On an opaque origin Chromium
   throws on the first localStorage access, which aborts js/core.js partway
   through — leaving every `const` after that point permanently in the temporal
   dead zone and the page failing with "Cannot access 'currentUser' before
   initialization". A static server is one line and removes the whole class. */
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css' };
function serve(){
  return new Promise(res => {
    const srv = http.createServer((req, rep) => {
      const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
      const file = path.join(ROOT, rel);
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
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve();
  const PAGE = `http://127.0.0.1:${srv.address().port}/test/chromium/room.html`;
  const browser = await chromium.launch({ executablePath: EXEC });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const errors = [];
  /* /favicon.ico is requested by the browser itself, not by the page, and this
     harness serves no icon — so it is excluded by name rather than by loosening
     the check. Everything else that 404s or throws is a real failure. */
  const noise = u => /\/favicon\.ico$/.test(String(u || ''));
  page.on('pageerror', e => errors.push('pageerror: ' + String(e).split('\n')[0]));
  page.on('response', r => { if (r.status() >= 400 && !noise(r.url())) errors.push(r.status() + ' ' + r.url()); });
  page.on('console', m => { if (m.type() === 'error' && !noise(m.location().url)) errors.push('console: ' + m.text()); });

  await page.goto(PAGE);
  await page.waitForFunction(() => window.READY !== undefined);
  await page.evaluate(() => window.READY);
  await page.waitForSelector('.nego-room .nego-pane.working .nego-clause', { timeout: 10000 });

  check('the room renders with no page errors', errors.length === 0, errors.join(' | ') || 'clean');

  /* ---------- clause structure ---------- */
  const doc = await page.evaluate(() => {
    const q = sel => Array.from(document.querySelectorAll(sel));
    const working = q('.nego-room .nego-pane.working .nego-clause');
    const baseline = q('.nego-room .nego-pane.baseline .nego-clause');
    return {
      workingCount: working.length,
      baselineCount: baseline.length,
      titles: working.map(n => (n.querySelector('h2') || {}).textContent || '').map(s => s.replace(/\s+/g, ' ').trim()),
      badged: working.filter(n => n.querySelector('.nego-badge')).map(n => n.querySelector('.nego-badge').textContent.trim()),
      unbadged: working.filter(n => !n.querySelector('.nego-badge'))
        .map(n => (n.querySelector('h2') || {}).textContent.replace(/\s+/g, ' ').trim()),
      cards: q('.nego-room .nego-card').length,
    };
  });

  check('six clauses in the working pane', doc.workingCount === 6, `${doc.workingCount} clauses`);
  check('six clauses in the baseline pane', doc.baselineCount === 6, `${doc.baselineCount} clauses`);
  check('every clause has a real title', doc.titles.every(t => /^Clause \d+ · \S/.test(t)),
    doc.titles.join(' | '));
  check('titles are the prototype’s own, with its non-contiguous numbering',
    doc.titles.map(t => (t.match(/^Clause (\d+)/) || [])[1]).join(',') === '1,4,5,6,9,12',
    doc.titles.map(t => (t.match(/^Clause (\d+)/) || [])[1]).join(','));
  check('exactly one badge per CHANGED clause — four of six', doc.badged.length === 4,
    doc.badged.join(' '));
  check('and none on the unchanged clauses 1 and 12',
    doc.unbadged.length === 2 && /Clause 1 ·/.test(doc.unbadged[0]) && /Clause 12 ·/.test(doc.unbadged[1]),
    doc.unbadged.join(' | '));
  check('four cards in the change index', doc.cards === 4, `${doc.cards} cards`);

  /* ---------- the redline is readable ---------- */
  const redline = await page.evaluate(() => {
    const clause = Array.from(document.querySelectorAll('.nego-room .nego-pane.working .nego-clause'))
      .find(n => /Clause 6 ·/.test((n.querySelector('h2') || {}).textContent || ''));
    const p = clause.querySelector('p');
    return {
      dels: Array.from(p.querySelectorAll('.nego-del')).map(n => n.textContent),
      inss: Array.from(p.querySelectorAll('.nego-ins')).map(n => n.textContent),
      text: p.textContent.replace(/\s+/g, ' ').trim(),
    };
  });
  check('a rewritten clause is ONE strikeout and ONE insertion, not shreds',
    redline.dels.length === 1 && redline.inss.length === 1,
    `${redline.dels.length} del / ${redline.inss.length} ins`);
  check('the deletion reads as one passage', /full replacement value of the affected goods/.test(redline.dels[0] || ''),
    JSON.stringify((redline.dels[0] || '').slice(0, 60)));
  check('the insertion reads as one passage', /EUR 250,000 in the aggregate per contract year/.test(redline.inss[0] || ''),
    JSON.stringify((redline.inss[0] || '').slice(0, 60)));

  const small = await page.evaluate(() => {
    const clause = Array.from(document.querySelectorAll('.nego-room .nego-pane.working .nego-clause'))
      .find(n => /Clause 4 ·/.test((n.querySelector('h2') || {}).textContent || ''));
    const p = clause.querySelector('p');
    return { dels: Array.from(p.querySelectorAll('.nego-del')).map(n => n.textContent),
      inss: Array.from(p.querySelectorAll('.nego-ins')).map(n => n.textContent),
      untouched: /Invoices shall be issued monthly in arrears/.test(p.textContent) };
  });
  check('a small edit marks only what moved, as one run each way',
    small.dels.length === 1 && small.inss.length === 1
      && /thirty \(30\)/.test(small.dels[0]) && /forty-five \(45\)/.test(small.inss[0]),
    `${JSON.stringify(small.dels)} → ${JSON.stringify(small.inss)}`);
  check('and the untouched sentences stay as plain context', small.untouched);

  /* ---------- layout, measured ---------- */
  const layout = await page.evaluate(() => {
    const clause = document.querySelector('.nego-room .nego-pane.working .nego-clause .nego-badge').closest('.nego-clause');
    const badge = clause.querySelector('.nego-badge');
    const body = clause.querySelector('p');
    const b = badge.getBoundingClientRect(), t = body.getBoundingClientRect();
    const panes = ['baseline', 'working', 'index'].map(k => {
      const el = document.querySelector('.nego-room .nego-pane.' + k);
      const r = el.getBoundingClientRect();
      return { k, x: Math.round(r.x), w: Math.round(r.width), h: Math.round(r.height) };
    });
    return {
      badge: { x: Math.round(b.x), right: Math.round(b.right), w: Math.round(b.width), h: Math.round(b.height) },
      body: { x: Math.round(t.x), right: Math.round(t.right), w: Math.round(t.width) },
      panes,
      docWidth: Math.round(document.querySelector('.nego-room .nego-doc').getBoundingClientRect().width),
      bodyScrollW: document.body.scrollWidth, innerW: window.innerWidth,
    };
  });
  check('the badge sits OUTSIDE the text column, in the margin',
    layout.badge.right <= layout.body.x,
    `badge right ${layout.badge.right}px ≤ text left ${layout.body.x}px`);
  check('all three panes are laid out side by side with real width',
    layout.panes.every(p => p.w > 200) && layout.panes[0].x < layout.panes[1].x && layout.panes[1].x < layout.panes[2].x,
    layout.panes.map(p => `${p.k} ${p.w}×${p.h} @${p.x}`).join(', '));
  check('the page does not scroll horizontally',
    layout.bodyScrollW <= layout.innerW, `scrollWidth ${layout.bodyScrollW} ≤ ${layout.innerW}`);

  /* ---------- the Verified pill ---------- */
  const pill = await page.evaluate(() => {
    const p = document.querySelector('.nego-room .nego-card [data-verify]');
    const seg = document.querySelector('.nego-room #nego-integrity');
    return { text: p ? p.textContent.trim() : null, state: p ? p.getAttribute('data-verify') : null,
      strip: seg ? seg.textContent.replace(/\s+/g, ' ').trim() : null };
  });
  check('the Verified pill says Verified, and only because the chain was walked',
    pill.state === 'ok' && pill.text === 'Verified', `${pill.text} (${pill.state})`);
  check('the status strip reports how many records were verified',
    /Fingerprints: 4 verified/.test(pill.strip || ''), pill.strip);

  await page.screenshot({ path: path.join(OUT, '01-room-full.png') });

  /* ---------- synchronised highlighting ---------- */
  await page.click('.nego-room .nego-card');
  await page.waitForTimeout(300);
  const sync = await page.evaluate(() => {
    const act = sel => document.querySelectorAll(sel).length;
    return {
      baseline: act('.nego-room .nego-pane.baseline .nego-clause.is-active'),
      working: act('.nego-room .nego-pane.working .nego-clause.is-active'),
      card: act('.nego-room .nego-card.is-active'),
      badge: act('.nego-room .nego-badge.is-active'),
    };
  });
  check('clicking a card lights the clause in all three panes at once',
    sync.baseline === 1 && sync.working === 1 && sync.card === 1,
    `baseline ${sync.baseline}, working ${sync.working}, card ${sync.card}, badge ${sync.badge}`);
  await page.screenshot({ path: path.join(OUT, '02-sync-highlight.png') });

  /* ---------- a decision, and what it looks like ---------- */
  const firstId = await page.evaluate(() => document.querySelector('.nego-room [data-nego-accept]').getAttribute('data-nego-accept'));
  await page.click(`.nego-room [data-nego-accept="${firstId}"]`);
  await page.waitForTimeout(400);
  const accepted = await page.evaluate(id => {
    const badge = document.querySelector(`.nego-room .nego-pane.working [data-badge="${id}"]`);
    const clause = badge.closest('.nego-clause');
    return { badge: badge.textContent.trim(), cls: badge.className,
      note: (clause.querySelector('.nego-note') || {}).textContent || '',
      hasDel: !!clause.querySelector('.nego-del'),
      text: clause.querySelector('p').textContent.replace(/\s+/g, ' ').trim().slice(0, 80) };
  }, firstId);
  check('an accepted change gains a tick and the wording moves',
    /✓$/.test(accepted.badge) && /is-accepted/.test(accepted.cls) && !accepted.hasDel
      && /forty-five \(45\)/.test(accepted.text),
    `${accepted.badge} · ${accepted.note} · ${accepted.text.slice(0, 50)}…`);
  await page.screenshot({ path: path.join(OUT, '03-accepted.png') });

  /* A decision invalidates the verification cache, so the room has to walk the
     chain again and SAY SO. It used to sit on "checking…" for ever here,
     because the refresh lived only in the embedded-tab render path. */
  await page.waitForTimeout(400);
  const reverify = await page.evaluate(() => {
    const seg = document.querySelector('.nego-room #nego-integrity');
    const pill = document.querySelector('.nego-room .nego-card [data-verify]');
    return { strip: seg ? seg.textContent.replace(/\s+/g, ' ').trim() : null,
      pill: pill ? pill.getAttribute('data-verify') : null };
  });
  check('after a decision the room re-verifies rather than sitting on "checking…"',
    /Fingerprints: \d+ verified/.test(reverify.strip || '') && reverify.pill === 'ok',
    `${reverify.strip} · pill ${reverify.pill}`);

  /* ---------- the clause tools ----------
     They used to be revealed on hover, in the right margin, where the pane
     clipped them — invisible until pointed at, and then half off-screen. They
     are the only way to propose anything now, so they are always drawn, inside
     the clause, in the room's slate. */
  const tools = await page.evaluate(() => {
    const c = document.querySelector('.nego-room .nego-pane.working .nego-clause');
    const t = c.querySelector('.nego-tools');
    if (!t) return null;
    const r = t.getBoundingClientRect();
    const pane = c.closest('.nego-pane').getBoundingClientRect();
    const btn = t.querySelector('button');
    const br = btn.getBoundingClientRect();
    const cs = getComputedStyle(btn);
    return { opacity: getComputedStyle(t).opacity,
      inPane: r.left >= pane.left - 1 && r.right <= pane.right + 1,
      visibleArea: Math.round(br.width) * Math.round(br.height),
      bg: cs.backgroundColor, fg: cs.color,
      buttons: Array.from(t.querySelectorAll('button')).map(x => x.textContent.trim()),
      hoveredAnything: false };
  });
  check('the clause tools are drawn without hovering anything',
    tools && Number(tools.opacity) === 1, tools ? `opacity ${tools.opacity}` : 'missing');
  check('and sit INSIDE the pane, where nothing can clip them',
    tools && tools.inPane, tools ? `inPane ${tools.inPane}` : 'missing');
  check('each one has real clickable area and a dark fill',
    tools && tools.visibleArea > 400 && /rgb\(51, 71, 92\)|rgb\(176, 69, 60\)/.test(tools.bg)
      && /rgb\(255, 255, 255\)/.test(tools.fg),
    tools ? `${tools.visibleArea}px², bg ${tools.bg}, fg ${tools.fg}, [${tools.buttons.join(', ')}]` : 'missing');
  await page.screenshot({ path: path.join(OUT, '04-clause-tools.png') });

  /* ---------- the two features added after the first Chromium pass ---------- */

  /* Ask Copilot. It opens HaTi's OWN panel — the same element every other
     screen uses — so the check is that the real panel becomes visible and ends
     up ABOVE the room rather than behind it, which is why it could not simply
     be opened before. Hit-tested, not read off a stylesheet. */
  const cop = await page.evaluate(async () => {
    const btn = document.querySelector('.nego-room #nego-copilot');
    const panel = document.getElementById('ai-panel');
    if (!btn || !panel) return { btn: !!btn, panel: !!panel };
    const before = panel.className;
    btn.click();
    /* The panel slides in over 300ms (transform, not display), so measuring
       immediately measures it mid-flight, still off the right edge. */
    await new Promise(r => setTimeout(r, 450));
    const r = panel.getBoundingClientRect();
    const room = document.querySelector('.nego-room').getBoundingClientRect();
    const zPanel = Number(getComputedStyle(panel).zIndex) || 0;
    const zRoom = Number(getComputedStyle(document.querySelector('.nego-room')).zIndex) || 0;
    const hit = document.elementFromPoint(Math.round(r.x + r.width / 2), Math.round(r.y + 40));
    return { btn: true, panel: true,
      opened: panel.className !== before || panel.classList.contains('open'),
      isRealPanel: panel.id === 'ai-panel' && !document.querySelector('#nego-copilot-dock'),
      zPanel, zRoom, above: zPanel > zRoom,
      onScreen: r.right <= window.innerWidth + 1 && r.width > 100,
      onTop: !!(hit && hit.closest('#ai-panel')),
      bodyMarked: document.body.classList.contains('nego-room-open') };
  });
  check('Ask Copilot opens the application’s own panel, not a room-local clone',
    cop.isRealPanel && cop.opened, `opened ${cop.opened}, no dock ${cop.isRealPanel}`);
  check('the room lifts that panel above itself',
    cop.above && cop.bodyMarked, `panel z ${cop.zPanel} > room z ${cop.zRoom}, body marked ${cop.bodyMarked}`);
  check('the panel slides fully onto the screen',
    cop.onScreen, `right edge vs viewport — onScreen ${cop.onScreen}`);
  check('and the panel is what receives a click, not the page behind it',
    cop.onTop, `hit-test ${cop.onTop}`);
  await page.screenshot({ path: path.join(OUT, '05-copilot.png') });
  await page.evaluate(() => document.getElementById('ai-close')?.click());

  /* Share: the summary step. */
  const share = await page.evaluate(async () => {
    document.querySelector('.nego-room #nego-cop-close')?.click();
    document.querySelector('.nego-room #nego-share-link').click();
    await new Promise(r => setTimeout(r, 60));
    const root = document.getElementById('modal-root');
    const s1 = root.querySelector('#share-step-1'), s2 = root.querySelector('#share-step-2');
    if (!s1 || !s2) return { s1: !!s1, s2: !!s2 };
    const vis = el => getComputedStyle(el).display !== 'none';
    const out = { s1: true, s2: true, step1Visible: vis(s1), step2Visible: vis(s2),
      summary: (root.querySelector('#sh-summary') || {}).value || '',
      ids: Array.from(s1.querySelectorAll('span')).map(n => n.textContent.trim())
        .filter(t => /^#CHG-\d+$/.test(t)) };
    return out;
  });
  check('Share opens on the summary, with the send form behind Next',
    share.step1Visible === true && share.step2Visible === false,
    `step1 ${share.step1Visible}, step2 ${share.step2Visible}`);
  check('the summary lists the fingerprints on the table',
    (share.ids || []).length === 4, (share.ids || []).join(' '));
  check('the summary is prefilled from the record',
    /#CHG-001 · Clause 4 · Payment Terms/.test(share.summary || ''),
    JSON.stringify(String(share.summary).split('\n')[1] || '').slice(0, 80));
  await page.screenshot({ path: path.join(OUT, '06-share-summary.png') });

  const afterNext = await page.evaluate(async () => {
    const root = document.getElementById('modal-root');
    root.querySelector('#share-next').click();
    await new Promise(r => setTimeout(r, 40));
    const vis = el => getComputedStyle(el).display !== 'none';
    return { step1Visible: vis(root.querySelector('#share-step-1')),
      step2Visible: vis(root.querySelector('#share-step-2')),
      email: !!root.querySelector('#sh-email'), back: !!root.querySelector('#share-back') };
  });
  check('Next reveals the send form, with a way back to the summary',
    afterNext.step2Visible === true && afterNext.step1Visible === false
      && afterNext.email && afterNext.back,
    JSON.stringify(afterNext));
  await page.screenshot({ path: path.join(OUT, '07-share-send.png') });

  /* ---------- the space bar, pressed for real ----------
     jsdom can only be told that a synthetic event was not cancelled. A browser
     actually inserts the character, so this types into the reply field and
     reads back what landed there. The bug was that spaces vanished. */
  await page.evaluate(() => {
    document.getElementById('modal-root').innerHTML = '';
    const btn = document.querySelector('.nego-room [data-nego-discuss]');
    if (btn) btn.click();
  });
  await page.waitForTimeout(150);
  const typed = await page.evaluate(async () => {
    const input = document.querySelector('.nego-room [id^="nego-ti-"]');
    if (!input) return null;
    input.focus();
    return { id: input.id, focused: document.activeElement === input };
  });
  if (typed && typed.focused){
    await page.keyboard.type('Net-45 works for us');
    const got = await page.evaluate(id => document.getElementById(id).value, typed.id);
    check('the space bar reaches the discussion box', got === 'Net-45 works for us',
      JSON.stringify(got));
  } else {
    check('the space bar reaches the discussion box', false, 'could not focus the reply field');
  }

  /* ---------- the version selectors ---------- */
  const vsel = await page.evaluate(() => {
    const l = document.querySelector('.nego-room [data-nego-vsel="left"]');
    const r = document.querySelector('.nego-room [data-nego-vsel="right"]');
    if (!l || !r) return { l: !!l, r: !!r };
    const lb = l.getBoundingClientRect(), pane = l.closest('.nego-pane').getBoundingClientRect();
    return { l: true, r: true, lv: l.value, rv: r.value,
      options: Array.from(l.options).map(o => o.textContent.trim()),
      inPane: lb.left >= pane.left - 1 && lb.right <= pane.right + 1,
      bar: !!document.querySelector('.nego-room #nego-cmp-bar') };
  });
  check('each pane header is a version selector', vsel.l && vsel.r,
    `left=${vsel.lv} right=${vsel.rv}`);
  check('it opens on the live pair, with no comparison banner',
    vsel.lv === 'baseline' && vsel.rv === 'working' && vsel.bar === false,
    `${vsel.lv} / ${vsel.rv}, banner ${vsel.bar}`);
  check('the selector sits inside its pane', vsel.inPane, `inPane ${vsel.inPane}`);
  check('and it offers the snapshots as well as the live pair',
    (vsel.options || []).length >= 3, (vsel.options || []).join(' | '));

  const compared = await page.evaluate(async () => {
    const l = document.querySelector('.nego-room [data-nego-vsel="left"]');
    const old = Array.from(l.options).find(o => /^v\d/.test(o.value));
    if (!old) return { noVersions: true };
    l.value = old.value;
    l.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(r => setTimeout(r, 120));
    const bar = document.querySelector('.nego-room #nego-cmp-bar');
    return {
      bar: !!bar, text: bar ? bar.textContent.replace(/\s+/g, ' ').trim().slice(0, 110) : null,
      accepts: document.querySelectorAll('.nego-room [data-nego-accept]').length,
      rejects: document.querySelectorAll('.nego-room [data-nego-reject]').length,
      badges: document.querySelectorAll('.nego-room .nego-badge').length,
      rows: document.querySelectorAll('.nego-room [data-nego-cmp-row]').length,
      exit: !!document.querySelector('.nego-room #nego-cmp-exit') };
  });
  check('picking an old version enters a comparison and says so',
    compared.bar && /Comparing versions/.test(compared.text || ''), compared.text);
  check('a comparison offers no decisions — nobody proposed these differences',
    compared.accepts === 0 && compared.rejects === 0 && compared.badges === 0,
    `${compared.accepts} accept, ${compared.rejects} reject, ${compared.badges} badges`);
  check('and it carries the way back out',
    compared.exit === true, `exit button ${compared.exit}`);
  await page.screenshot({ path: path.join(OUT, '08-version-compare.png') });

  const back = await page.evaluate(async () => {
    document.querySelector('.nego-room #nego-cmp-exit').click();
    await new Promise(r => setTimeout(r, 120));
    return { bar: !!document.querySelector('.nego-room #nego-cmp-bar'),
      lv: document.querySelector('.nego-room [data-nego-vsel="left"]').value };
  });
  check('Back to the live round restores the working screen',
    back.bar === false && back.lv === 'baseline', `banner ${back.bar}, left ${back.lv}`);

  /* ---------- ONE NOTICE AT A TIME ----------
     jsdom can count the elements. Only a browser can say the survivor is laid
     out where a notice belongs — full width, above the panes, not overlapping
     the documents it sits over. */
  const notices = await page.evaluate(() => {
    const room = document.querySelector('.nego-room');
    const ids = ['nego-ready-signal', 'nego-ready', 'nego-turn', 'nego-closed'];
    const on = ids.filter(id => room.querySelector('[id="' + id + '"]'));
    const el = on.length ? room.querySelector('[id="' + on[0] + '"]') : null;
    const r = el ? el.getBoundingClientRect() : null;
    const panes = room.querySelector('.nego-pane.baseline').getBoundingClientRect();
    return { on, w: r ? Math.round(r.width) : 0, h: r ? Math.round(r.height) : 0,
      bottom: r ? Math.round(r.bottom) : 0, panesTop: Math.round(panes.top),
      roomW: Math.round(room.getBoundingClientRect().width) };
  });
  check('exactly one notice is raised in the room', notices.on.length === 1,
    notices.on.join(', ') || 'none');
  check('and it is laid out as a banner, not squeezed in beside something',
    notices.w > notices.roomW * 0.8 && notices.h >= 20,
    `${notices.w}×${notices.h} in a ${notices.roomW}px room`);
  check('it sits above the documents rather than over them',
    notices.bottom <= notices.panesTop + 1,
    `notice ends ${notices.bottom}, panes start ${notices.panesTop}`);

  /* ---------- the counterparty's page ----------
     Rendered in the same browser, from a payload the product really built, so
     the claim "it looks and feels exactly like the negotiation page" is
     measured rather than asserted. The owner's numbers were taken above; these
     are compared against them. */
  const theirs = await page.evaluate(async () => {
    const c = window.CONTRACT;
    const payload = buildSharePayload(c, 'dochash-chromium',
      { org: 'Wanjiru Catering Ltd', sharedBy: 'Wanjiru Kamau' });
    document.getElementById('nego-room-root').innerHTML = '';
    document.body.classList.remove('nego-room-open');
    window.PORTAL_OPTS = { payload, token: 'tok', superseded: false, responded: false };
    window.openNegotiationRoom(portalNegoContract(payload), {
      side: 'counterparty', by: 'Erik Lindqvist', author: 'Erik Lindqvist',
      recipientName: 'Erik Lindqvist',
      org: 'Wanjiru Catering Ltd', persist: false });
    await new Promise(r => setTimeout(r, 200));
    const room = document.querySelector('.nego-room');
    if (!room) return { room: false };
    const panes = ['baseline', 'working', 'index'].map(k => {
      const el = room.querySelector('.nego-pane.' + k);
      const r = el.getBoundingClientRect();
      return { k, w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x) };
    });
    const has = id => !!room.querySelector('#' + id);
    return { room: true, panes,
      dividers: room.querySelectorAll('.nego-rz').length,
      badges: room.querySelectorAll('.nego-pane.working .nego-badge').length,
      cards: room.querySelectorAll('.nego-card').length,
      tools: room.querySelectorAll('.nego-pane.working .nego-tools').length,
      ownerOnly: ['nego-copilot', 'nego-save-draft', 'nego-share-link', 'nego-insert-lib'].filter(has),
      theirVerbs: ['nego-cp-ready', 'nego-cp-decline'].filter(has),
      /* The verbs that are GONE, and the one that was never theirs to press. */
      retired: ['nego-cp-sign', 'nego-cp-accept', 'nego-send'].filter(has),
      crumbs: room.querySelector('.nego-crumbs').textContent.replace(/\s+/g, ' ').trim(),
      strip: room.querySelector('#nego-status').textContent.replace(/\s+/g, ' ').trim(),
      bodyScrollW: document.body.scrollWidth, innerW: window.innerWidth };
  });

  check('the counterparty lands on the full-window room', theirs.room);
  /* WIDTH is the claim: the counterparty used to get a preview squeezed into a
     card, so "the same screen" is about how much of it they get. Height is
     allowed to differ by a banner's worth — the two sides carry different
     banners above the panes, legitimately, and asserting them equal would be
     asserting the two sides say the same thing to each other. */
  check('their panes are exactly as wide as the owner’s, not a preview column',
    theirs.room && theirs.panes.every((p, i) => p.w === layout.panes[i].w),
    theirs.room ? theirs.panes.map((p, i) => `${p.k} ${p.w} vs ${layout.panes[i].w}`).join(', ') : 'no room');
  check('and as tall, to within one banner',
    theirs.room && theirs.panes.every((p, i) => Math.abs(p.h - layout.panes[i].h) <= 40),
    theirs.room ? theirs.panes.map((p, i) => `${p.k} ${p.h} vs ${layout.panes[i].h}`).join(', ') : 'no room');
  check('and the same two draggable dividers', theirs.dividers === 2, `${theirs.dividers} dividers`);
  check('the fingerprints and their cards are on their screen',
    theirs.badges === 4 && theirs.cards === 4, `${theirs.badges} badges, ${theirs.cards} cards`);
  check('they can propose — every clause carries its tools',
    theirs.tools === 6, `${theirs.tools} clauses with tools`);
  check('none of the owner-only controls reach their screen',
    theirs.ownerOnly && theirs.ownerOnly.length === 0,
    (theirs.ownerOnly || []).join(', ') || 'none');
  check('their two deal verbs are in the slot the owner uses for Save Draft',
    theirs.theirVerbs && theirs.theirVerbs.length === 2, (theirs.theirVerbs || []).join(', '));
  check('and the retired ones are not rendered at all',
    theirs.retired && theirs.retired.length === 0,
    (theirs.retired || []).join(', ') || 'none: Accept wording, Approve & sign and the owner’s Send are gone');
  check('our filing structure is not on their breadcrumb',
    !/Contract Workspace/.test(theirs.crumbs || '') && !/\bWH\b/.test(theirs.crumbs || ''),
    theirs.crumbs);
  check('our mail config and our watching of them are not on their strip',
    !/Email:/.test(theirs.strip || '') && !/Last seen/.test(theirs.strip || ''),
    theirs.strip);
  check('their page does not scroll sideways either',
    theirs.bodyScrollW <= theirs.innerW, `${theirs.bodyScrollW} ≤ ${theirs.innerW}`);
  await page.screenshot({ path: path.join(OUT, '09-counterparty.png') });

  /* ---------- THE WAY OUT THAT IS NOT THERE ----------
     jsdom can say the element is absent. Only a browser can say the breadcrumb
     row still looks like a breadcrumb row afterwards rather than collapsing,
     and that nothing else in the chrome is offering a route off the page. */
  const noExit = await page.evaluate(() => {
    const room = document.querySelector('.nego-room');
    const crumbs = room.querySelector('.nego-crumbs');
    const cr = crumbs.getBoundingClientRect();
    const clickable = Array.from(room.querySelectorAll('.nego-topbar button, .nego-topbar a'))
      .map(n => (n.id || n.className) + ':' + n.textContent.replace(/\s+/g, ' ').trim());
    return { exit: !!room.querySelector('#nego-exit'),
      exitClass: room.querySelectorAll('.nego-exit').length,
      crumbText: crumbs.textContent.replace(/\s+/g, ' ').trim(),
      crumbH: Math.round(cr.height), crumbW: Math.round(cr.width),
      topbarControls: clickable };
  });
  check('there is no exit control anywhere in their chrome',
    noExit.exit === false && noExit.exitClass === 0,
    `#nego-exit ${noExit.exit}, .nego-exit ×${noExit.exitClass}`);
  check('and no route off the page is offered by any other name',
    !/(^|:)\s*(←|Doc|Back|Close|Exit)/i.test(noExit.topbarControls.join(' | ')),
    noExit.topbarControls.join(' | '));
  check('the breadcrumb row still lays out, rather than collapsing without it',
    noExit.crumbH >= 14 && noExit.crumbW > 100,
    `${noExit.crumbW}×${noExit.crumbH} — "${noExit.crumbText}"`);

  /* Escape, pressed for real. */
  await page.keyboard.press('Escape');
  await page.waitForTimeout(120);
  const afterEsc = await page.evaluate(() => !!document.querySelector('.nego-room'));
  check('Escape does not empty the window under them', afterEsc === true,
    afterEsc ? 'the room is still the page' : 'THE ROOM CLOSED');

  /* ---------- THE NAME FIELD, in the room ---------- */
  const who = await page.evaluate(() => {
    const el = document.querySelector('.nego-room #nego-cp-name');
    if (!el) return { there: false };
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const bar = document.querySelector('.nego-room .nego-top-actions').getBoundingClientRect();
    return { there: true, value: el.value, w: Math.round(r.width), h: Math.round(r.height),
      color: cs.color, inBar: r.x >= bar.x - 1 && r.right <= bar.right + 1 };
  });
  check('the name they answer under is a real, visible field in the room',
    who.there && who.w > 80 && who.h > 18, `${who.w}×${who.h}`);
  check('prefilled from who the link was addressed to',
    who.value === 'Erik Lindqvist', JSON.stringify(who.value));
  check('and it sits in the action bar, not off the edge of it', who.inBar === true,
    `in bar: ${who.inBar}, colour ${who.color}`);

  /* ---------- THE GATE, SHUT ----------
     The claim is "visible but plainly disabled, and says what is outstanding".
     Each half of that is a measurement: the button has real size, its label is
     not washed out to unreadability, and the line beside it is on screen with
     text in it. */
  const shut = await page.evaluate(() => {
    const room = document.querySelector('.nego-room');
    const b = room.querySelector('#nego-cp-ready');
    const why = room.querySelector('#nego-ready-why');
    const rb = b.getBoundingClientRect();
    const cb = getComputedStyle(b);
    const rw = why ? why.getBoundingClientRect() : null;
    return { label: b.textContent.trim(), disabled: b.disabled,
      w: Math.round(rb.width), h: Math.round(rb.height),
      opacity: Number(cb.opacity), color: cb.color, border: cb.borderStyle,
      cursor: cb.cursor, title: b.getAttribute('title'),
      why: why ? why.textContent.replace(/\s+/g, ' ').trim() : null,
      whyW: rw ? Math.round(rw.width) : 0, whyH: rw ? Math.round(rw.height) : 0,
      whyOnScreen: !!rw && rw.right <= window.innerWidth + 1 && rw.width > 40 };
  });
  check('with changes outstanding the button is present, and says Ready to sign',
    shut.label === 'Ready to sign' && shut.w > 60 && shut.h > 20,
    `"${shut.label}" ${shut.w}×${shut.h}`);
  check('it is plainly not pressable', shut.disabled === true && shut.cursor === 'not-allowed',
    `disabled ${shut.disabled}, cursor ${shut.cursor}, border ${shut.border}`);
  check('and it is still LEGIBLE — not faded out to where the label cannot be read',
    shut.opacity === 1, `opacity ${shut.opacity}, colour ${shut.color}`);
  check('the reason is on the screen beside it, not only in a tooltip',
    shut.whyOnScreen && /waiting on a decision|refused/.test(shut.why || ''),
    `${shut.whyW}×${shut.whyH} — "${shut.why}"`);
  check('and the tooltip says the same thing rather than something else',
    shut.title === shut.why, `title "${shut.title}"`);
  await page.screenshot({ path: path.join(OUT, '10-ready-disabled.png') });

  /* ---------- THE GATE, OPEN ----------
     Every ask on this fixture is the counterparty's own, so it is the OWNER who
     answers them. Answered, the parties are aligned and the button opens. */
  const open = await page.evaluate(async () => {
    const c = window.CONTRACT;
    for (const ch of negoChanges(c))
      negoResolve(c, ch.id, 'accepted', { side: 'owner', by: 'Wanjiru Kamau' });
    const payload = buildSharePayload(c, 'dochash-chromium',
      { org: 'Wanjiru Catering Ltd', sharedBy: 'Wanjiru Kamau' }, { purpose: 'negotiate' });
    window.PORTAL_OPTS = { payload, token: 'tok', superseded: false, responded: false };
    document.getElementById('nego-room-root').innerHTML = '';
    window.openNegotiationRoom(portalNegoContract(payload), {
      side: 'counterparty', by: 'Erik Lindqvist', author: 'Erik Lindqvist',
      recipientName: 'Erik Lindqvist', org: 'Wanjiru Catering Ltd', persist: false,
      /* One decision held on their page, so the send that carries it is on the
         screen to be measured. Where it SITS is the claim here. */
      pendingDecisions: 1 });
    await new Promise(r => setTimeout(r, 200));
    const room = document.querySelector('.nego-room');
    const b = room.querySelector('#nego-cp-ready');
    const cb = getComputedStyle(b);
    const rb = b.getBoundingClientRect();
    const send = room.querySelector('#nego-send-decisions');
    const idx = room.querySelector('.nego-pane.index').getBoundingClientRect();
    const bar = room.querySelector('.nego-top-actions').getBoundingClientRect();
    const rs = send ? send.getBoundingClientRect() : null;
    return { label: b.textContent.trim(), disabled: b.disabled,
      bg: cb.backgroundColor, cursor: cb.cursor,
      w: Math.round(rb.width), h: Math.round(rb.height),
      why: !!room.querySelector('#nego-ready-why'),
      send: !!send, sendText: send ? send.textContent.replace(/\s+/g, ' ').trim() : null,
      sendInIndex: !!rs && rs.x >= idx.x - 1 && rs.right <= idx.right + 1
        && rs.y >= idx.y - 1 && rs.bottom <= idx.bottom + 1,
      sendInTopBar: !!rs && rs.y < bar.bottom };
  });
  check('with everything settled the same button opens',
    open.disabled === false && open.cursor !== 'not-allowed',
    `disabled ${open.disabled}, cursor ${open.cursor}, background ${open.bg}`);
  check('it keeps its size and its name — the control did not move or rename itself',
    open.label === 'Ready to sign' && Math.abs(open.w - shut.w) <= 2 && open.h === shut.h,
    `${open.w}×${open.h} vs ${shut.w}×${shut.h}`);
  check('and the line explaining what was outstanding is gone, because nothing is',
    open.why === false, `why line present: ${open.why}`);
  check('the send for held decisions sits INSIDE the change index',
    open.send && open.sendInIndex && !open.sendInTopBar,
    `${open.sendText} — in index: ${open.sendInIndex}, in top bar: ${open.sendInTopBar}`);
  await page.screenshot({ path: path.join(OUT, '11-ready-enabled.png') });

  await browser.close();
  srv.close();

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  console.log('measurements:', JSON.stringify(layout));
  if (failed.length){ console.log('FAILED:', failed.map(f => f.name).join('; ')); process.exit(1); }
})().catch(e => { console.error(e); process.exit(1); });
