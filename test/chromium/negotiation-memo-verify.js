/* THE NEGOTIATION MEMO — driven where the reader stands
   =====================================================
   Owner-asked 9 Sep 2026. One page on demand: what is agreed, what is still
   open, what we gave up, what is blocking, and whose move it is.

   WHY THIS FILE EXISTS AND f269 IS NOT ENOUGH. f269 asks what the reading
   returns and what the source may reach for. It cannot ask the four things
   that decide whether the feature works:
     · is the row in the More menu VISIBLE PIXELS once the menu is open
       (f180's rule — a verb in the DOM and not on screen is not a verb);
     · does a real press open the drawer;
     · does the negotiation the memo is ABOUT stay lit and readable behind it —
       which is the entire reason openSidePanel was chosen over a scrimmed
       modal, and which no source check can see;
     · and does the memo, which is a reading, really leave the record alone.

   Screenshots land in test/chromium/shots/negotiation-memo/.
   Run: node test/chromium/negotiation-memo-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = path.join(__dirname, 'shots', 'negotiation-memo');
fs.mkdirSync(OUT, { recursive: true });

let failures = 0;
const check = (ok, what, detail) => {
  console.log((ok ? '  ok  ' : '  FAIL') + ' — ' + what + (detail != null ? ` [${detail}]` : ''));
  if (!ok) failures++;
};

/* ON SCREEN, not merely in the markup — f180's rule. */
const visible = (page, sel) => page.evaluate(s => {
  const el = document.querySelector(s);
  if (!el) return false;
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return false;
  for (let n = el; n && n !== document.body; n = n.parentElement){
    const st = getComputedStyle(n);
    if (st.display === 'none' || st.visibility === 'hidden' || n.hidden) return false;
  }
  return true;
}, sel);

(async () => {
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
  const page = await ctx.newPage();

  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.fill('#li-email', 'admin@example.co.ke');
  await page.fill('#li-pass', 'adminpassword1');
  await page.click('#li-go');
  await page.waitForTimeout(2400);

  /* ---- A ROUND CARRYING ONE OF EVERY STATE THE MEMO REPORTS ----
     Filed through the real funnel, so what the memo reads is a record the
     product actually made rather than an object this file wrote. */
  const built = await page.evaluate(async () => {
    const c = state.contracts.find(x => x.status === 'Under Review') || state.contracts[0];
    state.activeId = c.id; state.selId = c.id;
    negoInit(c);
    const cl = negoClauseList(c);
    if (cl.length < 4) return { id: c.id, ids: [], clauses: cl.length };
    /* `why` IS THE ASKER'S OWN REASON and it is set at FILING — the funnel's
       revision branch updates the summary and leaves the reason alone, so a
       second edit cannot add one. */
    const file = (i, side, text, summary, why) => negoEditClause(c, cl[i].clauseId, `<p>${text}</p>`,
      { side, author: side === 'owner' ? 'Wanjiru Kamau' : 'Erik Lindqvist', summary, why });
    await file(0, 'counterparty', 'Payment falls due within sixty (60) days.', 'Net-60');
    await file(1, 'counterparty', 'The cap is limited to six months of fees.', 'Cap to six months');
    await file(2, 'counterparty', 'Either party may terminate on ninety (90) days notice.', 'Notice to 90',
      'Ninety days is what our board approved.');
    await file(3, 'owner', 'Certificates are furnished each quarter.', 'Certificates quarterly');
    const chs = negoChanges(c);
    negoResolve(c, chs[0].id, 'accepted', { by: 'Wanjiru Kamau' });   // agreed
    negoResolve(c, chs[1].id, 'rejected', { by: 'Wanjiru Kamau' });   // blocking
    /* "WE GAVE UP" IS A TWO-STEP JOURNEY AND THE PRODUCT INSISTS ON IT:
       negoWithdraw refuses anything not already refused, because withdrawing
       is the ASKER accepting the other side's no. So our ask has to be refused
       by them first — which is exactly what the section means. A first draft
       withdrew a pending change, the product quietly refused, and the section
       came back empty. */
    negoResolve(c, chs[3].id, 'rejected', { by: 'Erik Lindqvist' });
    const gave = negoWithdraw(c, chs[3].id, { by: 'Wanjiru Kamau', side: 'owner' });
    persist(c);
    return { id: c.id, ids: chs.map(x => x.id), changes: (c.changes || []).length,
      gave: !!(gave && gave.withdrawn) };
  });
  check(built.ids.length === 4 && built.gave, '0a the fixture filed one change of every state',
    built.ids.length ? built.ids.join(', ') + (built.gave ? '' : ' — but the withdrawal was refused') : `only ${built.clauses} clauses`);
  if (!built.ids.length){ console.log('\nfixture too small'); await browser.close(); await h.stop(); process.exit(1); }

  await page.evaluate(id => openRedlineWorkbench(id), built.id);
  await page.waitForTimeout(1800);

  /* ============ 1. THE ROW IS IN THE MENU, AND ON SCREEN ============ */
  /* EVERY DRIVEN HALF BELOW IS GUARDED. A build without the feature must
     REPORT its failures rather than time out on a click that will never find
     its target — a probe that throws proves nothing, and a crash reads as an
     infrastructure problem rather than as a missing feature. */
  const hasRow = await page.locator('[data-rl-memo]').count() === 1;
  check(hasRow, '1a the negotiation page puts exactly one memo row in the More menu');
  /* The menu is in the DOM the whole time and starts hidden, so a presence
     check alone passes on a row nobody can reach — open it first. */
  await page.click('#ws-more');
  await page.waitForTimeout(400);
  check(hasRow && await visible(page, '[data-rl-memo]'),
    '1b and once the menu is open the row is VISIBLE PIXELS');
  const rowText = hasRow ? await page.locator('[data-rl-memo]').innerText() : '';
  check(/memo|notat/i.test(rowText), '1c it says what it is', rowText.trim() || 'no row');
  await page.screenshot({ path: path.join(OUT, '01-menu.png') });

  /* ============ 2. THE PRESS OPENS THE MEMO ============ */
  const before = await page.evaluate(id => {
    const c = state.contracts.find(x => x.id === id);
    return { changes: (c.changes || []).length,
      json: JSON.stringify((c.changes || []).map(x => [x.id, x.status, !!x.withdrawn])) };
  }, built.id);

  if (hasRow){ await page.click('[data-rl-memo]'); await page.waitForTimeout(900); }

  const memo = await page.evaluate(() => {
    const p = document.getElementById('side-panel');
    if (!p) return null;
    const caps = Array.from(p.querySelectorAll('div')).map(d => d.textContent.trim());
    return { open: true, text: p.innerText, copy: !!document.getElementById('ng-memo-copy'),
      send: !!document.getElementById('ng-memo-send'),
      role: p.getAttribute('role'), n: caps.length };
  });
  check(!!memo, '2a the press opens the side panel');
  if (memo){
    /* MATCHED CASE-INSENSITIVELY: the section captions are uppercased by CSS,
       so innerText hands back "AGREED" and a case-sensitive check reports a
       correct panel as broken. */
    for (const word of ['Agreed', 'Still open', 'We gave up', 'Blocking the deal'])
      check(memo.text.toLowerCase().includes(word.toLowerCase()),
        `2b the memo carries the "${word}" section`);
    check(/Whose move/i.test(memo.text), '2c and says whose move it is');
    /* REVERSED IN PLACE 9 Sep 2026 — the memo shipped with Copy alone and the
       owner asked for the send beside it. The claim was never "one act": it
       was that the acts under the memo are there and are these. */
    check(memo.copy, '2d Copy is under it');
    check(memo.send, '2d2 and so is Send to a colleague — the owner asked for it back');
    check(memo.role === 'dialog', '2e it announces itself as a dialog', memo.role);
  }
  await page.screenshot({ path: path.join(OUT, '02-memo.png') });

  /* THE SECTIONS AGREE WITH THE READING. A panel that says something the
     model does not is the fault the whole "counting is not drawing" rule
     exists to prevent. */
  const agree = await page.evaluate(id => {
    const c = state.contracts.find(x => x.id === id);
    if (typeof window.negoMemo !== 'function') return { counts: {}, drawn: [null, null, null, null] };
    const m = window.negoMemo(c);
    const el = document.getElementById('side-panel');
    if (!el) return { counts: m.counts, drawn: [null, null, null, null] };
    const t = el.innerText;
    return { counts: m.counts,
      drawn: ['agreed','still open','we gave up','blocking the deal'].map(w => {
        const i = t.toLowerCase().indexOf(w); if (i < 0) return null;
        const mm = /(\d+)/.exec(t.slice(i, i + 60)); return mm ? Number(mm[1]) : null; }) };
  }, built.id);
  check(agree.drawn[0] === agree.counts.agreed && agree.drawn[1] === agree.counts.open
     && agree.drawn[2] === agree.counts.gave && agree.drawn[3] === agree.counts.blocking,
    '2f every count on screen is the number the reading returned',
    `drawn ${agree.drawn.join('/')} vs ${[agree.counts.agreed, agree.counts.open, agree.counts.gave, agree.counts.blocking].join('/')}`);
  check(agree.counts.agreed >= 1 && agree.counts.blocking >= 1 && agree.counts.gave >= 1,
    '2g and the fixture really exercised three of the four sections',
    JSON.stringify(agree.counts));

  /* ============ 2h. THE FULL WORDING, AND ITS MARKS ARE COLOURED ============ */
  /* (owner-reported 9 Sep 2026: "the memo is not taking the full quotes ...
     therefore the full clauses are not visible", then "build option 1 and add
     the reason".)

     WHY THIS CANNOT BE A SOURCE CHECK. nego-ins and nego-del are UNSCOPED and
     read tokens declared on the room and on the negotiation page; the memo is
     drawn in the shell's own side panel, a body-level sibling of both. So the
     markup can be perfectly correct and the redline still come out in the
     document's own ink — which is the fault this codebase has already paid for
     once, and only a computed style can see it. */
  const quoted = await page.evaluate(() => {
    const p = document.getElementById('side-panel');
    if (!p) return null;
    const ins = p.querySelector('ins, .nego-ins');
    const del = p.querySelector('del, .nego-del');
    const body = getComputedStyle(p).color;
    return { text: p.innerText,
      ins: !!ins, del: !!del,
      insColour: ins ? getComputedStyle(ins).color : '',
      delColour: del ? getComputedStyle(del).color : '',
      strike: del ? getComputedStyle(del).textDecorationLine : '',
      body };
  });
  check(!!(quoted && quoted.ins && quoted.del),
    '2h the memo quotes the wording with its marks — what goes and what arrives',
    quoted ? `ins ${quoted.ins} / del ${quoted.del}` : 'no panel');
  if (quoted && quoted.ins){
    check(quoted.insColour !== quoted.body,
      '2h2 and the insertion carries the redline’s own ink, not the panel’s',
      `${quoted.insColour} vs body ${quoted.body}`);
    check(quoted.delColour !== quoted.body && /line-through/.test(quoted.strike),
      '2h3 and the deletion is struck through in its own',
      `${quoted.delColour} · ${quoted.strike}`);
  }
  /* THE WORDING IS THE CONTRACT'S, IN FULL — the fixture's own sentence, which
     the card's 34-character summary could never carry. */
  check(!!quoted && /ninety \(90\) days notice/.test(quoted.text),
    '2h4 the whole proposed sentence is on the page, not a clipped fragment');
  check(!!quoted && /Ninety days is what our board approved/.test(quoted.text),
    '2h5 and the reason the asker gave is under it');

  /* AND IT STILL READS AT NIGHT. The memo draws the redline's marks on a
     ground the redline has never used — the shell's side panel, which is dark
     at night where the contract sheet stays white. That is a NEW combination
     and this codebase's record on marks-in-a-new-place is not good, so the
     ratio is measured rather than assumed. The class is flipped directly
     rather than through setTheme, which repaints the view and would take the
     panel with it: this is a question about CSS, not about state. */
  const night = await page.evaluate(() => {
    const root = document.documentElement;
    const had = root.classList.contains('dark');
    root.classList.add('dark');
    const p = document.getElementById('side-panel');
    const rgba = s => { const n = (String(s).match(/[\d.]+/g) || []).map(Number);
      return n.length ? { r: n[0], g: n[1], b: n[2], a: n.length > 3 ? n[3] : 1 }
                      : { r: 0, g: 0, b: 0, a: 0 }; };
    const over = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a),
      g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
    /* COMPOSITED, NEVER THE ELEMENT'S OWN BACKGROUND. At night the mark's fill
       is a 15% wash, so reading it alone reports 1.3:1 on a chip nobody has
       trouble reading — the fault contrast-verify records in its own words.
       Walk up blending until the alphas reach opaque. */
    const ground = el => { let out = { r: 255, g: 255, b: 255, a: 0 };
      const stack = [];
      for (let n = el; n; n = n.parentElement) stack.push(getComputedStyle(n).backgroundColor);
      stack.push('rgb(255,255,255)');
      for (let k = stack.length - 1; k >= 0; k--){
        const c = rgba(stack[k]);
        if (c.a > 0) out = over(c, out);
      }
      return out; };
    const lum = c => { const f = v => { v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
      return (x + 0.05) / (y + 0.05); };
    const one = sel => { const el = p && p.querySelector(sel); if (!el) return null;
      const st = getComputedStyle(el);
      const ink = over(rgba(st.color), ground(el.parentElement));
      return { r: ratio(ink, ground(el)), ink: st.color, bg: st.backgroundColor }; };
    const out = { ins: one('ins, .nego-ins'), del: one('del, .nego-del') };
    if (!had) root.classList.remove('dark');
    return out;
  });
  for (const k of ['ins', 'del']){
    const m = night && night[k];
    check(!!m && m.r >= 4.5, `2h6 the ${k === 'ins' ? 'insertion' : 'deletion'} still reads at night`,
      m ? `${m.r.toFixed(2)}:1 — ${m.ink} on ${m.bg}` : 'not drawn');
  }

  /* ============ 3. THE NEGOTIATION STAYS LIT BEHIND IT ============ */
  /* THE WHOLE REASON openSidePanel WAS CHOSEN. A scrimmed modal would put the
     memo in front of the thing it is about; this panel deliberately does not,
     so the contract stays readable and pressable while the memo is open. */
  const behind = await page.evaluate(() => {
    const scrim = document.querySelector('#modal-scrim, .modal-scrim, #panel-scrim, #ai-scrim');
    const lit = scrim ? getComputedStyle(scrim) : null;
    const paper = document.querySelector('.rl-paper, .rl-doc, #rl-doc');
    const r = paper ? paper.getBoundingClientRect() : null;
    /* Probe a point on the contract that the drawer does not cover, and ask
       the document what is actually painted there. */
    const x = r ? Math.round(r.left + Math.min(120, r.width / 3)) : 0;
    const y = r ? Math.round(r.top + 60) : 0;
    const at = (r && x > 0 && y > 0) ? document.elementFromPoint(x, y) : null;
    return {
      scrimmed: !!(lit && lit.display !== 'none' && lit.visibility !== 'hidden'
        && Number(lit.opacity || 1) > 0.01),
      paper: !!r && r.width > 0,
      onPaper: !!(at && at.closest && at.closest('.rl-paper, .rl-doc, #rl-doc')),
    };
  });
  check(behind.paper, '3a the contract is still drawn while the memo is open');
  check(!behind.scrimmed, '3b nothing dims it — the memo does not stand in front of its subject');
  check(behind.onPaper, '3c and the wording is still what the page hands back at that point');

  /* ============ 4. IT CHANGED NOTHING ============ */
  const after = await page.evaluate(id => {
    const c = state.contracts.find(x => x.id === id);
    return { changes: (c.changes || []).length,
      json: JSON.stringify((c.changes || []).map(x => [x.id, x.status, !!x.withdrawn])) };
  }, built.id);
  check(after.json === before.json, '4a opening the memo moved nothing on the record',
    after.changes + ' changes, identical states');

  /* ============ 5. COPY ============ */
  const canCopy = await page.locator('#ng-memo-copy').count() === 1;
  if (canCopy){ await page.click('#ng-memo-copy'); await page.waitForTimeout(700); }
  const clip = canCopy
    ? await page.evaluate(() => navigator.clipboard.readText().catch(() => '')).catch(() => '') : '';
  check(/Agreed/i.test(clip) && /Whose move/i.test(clip),
    '5a Copy puts the whole memo on the clipboard', String(clip).slice(0, 60).replace(/\n/g, ' | '));
  check(!/</.test(clip), '5b and it is plain text, not the panel’s markup');

  /* ============ 6. THE WAYS OUT ============ */
  const wasOpen = await page.locator('#side-panel').count() === 1;
  if (wasOpen){ await page.click('#side-panel-x'); await page.waitForTimeout(500); }
  check(wasOpen && await page.locator('#side-panel').count() === 0,
    '6a the ✕ closes it', wasOpen ? '' : 'it never opened');
  const stillThere = await page.evaluate(() => !!document.querySelector('.rl-paper, .rl-doc, #rl-doc')
    && (window.state || {}).view);
  check(stillThere === 'redline', '6b and leaves the reader on the negotiation', String(stillThere));

  if (hasRow){
    await page.click('#ws-more'); await page.waitForTimeout(300);
    await page.click('[data-rl-memo]'); await page.waitForTimeout(700);
  }
  const reopened = await page.locator('#side-panel').count() === 1;
  check(reopened, '6c it opens again');
  if (reopened){ await page.keyboard.press('Escape'); await page.waitForTimeout(500); }
  check(reopened && await page.locator('#side-panel').count() === 0,
    '6d Escape closes it too', reopened ? '' : 'it never opened');
  await page.screenshot({ path: path.join(OUT, '03-closed.png') });

  /* ============ 7. SEND IT TO A COLLEAGUE ============ */
  /* (owner-asked 9 Sep 2026: "We need to bring back the send to a colleague
     button.") THIS IS WHY THE FILE EXISTS: f269 can read the dialog's source
     and the route's refusals, and it cannot ask whether the button is
     reachable, whether the press opens anything, or whether what leaves the
     building is the memo that is on screen. This server has NO mail provider,
     so the honest answer is the outbox — which is one of the three the route
     promises, and the one that lets the whole journey be driven end to end and
     the message read back. */
  if (hasRow){
    await page.click('#ws-more'); await page.waitForTimeout(300);
    await page.click('[data-rl-memo]'); await page.waitForTimeout(700);
  }
  const panelText = await page.evaluate(() => {
    const p = document.getElementById('side-panel'); return p ? p.innerText : ''; });
  const canSend = await page.locator('#ng-memo-send').count() === 1;
  check(canSend && await visible(page, '#ng-memo-send'),
    '7a Send to a colleague is VISIBLE PIXELS under the memo');

  if (canSend){ await page.click('#ng-memo-send'); await page.waitForTimeout(600); }
  const dlg = await page.evaluate(() => {
    const sel = document.getElementById('ng-memo-who');
    if (!sel) return null;
    return { people: Array.from(sel.options).map(o => o.textContent.trim()),
      note: !!document.getElementById('ng-memo-note'),
      go: !!document.getElementById('ng-memo-go'),
      text: (document.getElementById('modal-root') || document.body).innerText };
  });
  check(!!dlg, '7b the press opens the picker');
  if (dlg){
    check(dlg.people.length >= 1, '7c it names colleagues off the roster', dlg.people.join(' / '));
    /* NEVER YOURSELF. The reading excludes the signed-in reader, and this is
       the admin who seeded the workspace. */
    check(!dlg.people.some(t => /admin@example\.co\.ke/.test(t)),
      '7d and never yourself', dlg.people.join(' / '));
    check(dlg.note && dlg.go, '7e with somewhere to say why, and one act');
    check(/address on file/i.test(dlg.text),
      '7f and it says where the message goes before it goes');
  }
  await page.screenshot({ path: path.join(OUT, '04-send.png') });

  /* ---- FIRST, THE COLLEAGUE WHO COULD NOT OPEN IT ----
     THE PICKER OFFERS EVERY COLLEAGUE AND THE ROUTE DECIDES, which is right:
     who may see which value stream is the server's answer and a browser that
     pre-filtered the list would be a second copy of it. So the refusal has to
     land somewhere the reader is looking — and this is the only place that can
     be checked. The seeded workspace has exactly the person for it: Restricted
     Legal sees one stream and this contract is in the other. */
  const walled = await page.evaluate(async () => {
    const sel = document.getElementById('ng-memo-who');
    if (!sel) return false;                       /* no dialog: report, never throw */
    const opt = Array.from(sel.options).find(o => /restricted@/.test(o.textContent));
    if (!opt) return false;
    sel.value = opt.value; return true;
  });
  if (walled){
    await page.click('#ng-memo-go');
    await page.waitForTimeout(1500);
  }
  const refused = await page.evaluate(() => {
    const err = document.getElementById('ng-memo-err');
    return { open: !!document.getElementById('ng-memo-go'),
      shown: !!(err && !err.hidden && err.textContent.trim()),
      say: err ? err.textContent.trim() : '' };
  });
  check(walled && refused.open, '7g a colleague who cannot see the contract does not close the dialog');
  check(refused.shown && /Restricted Legal/.test(refused.say),
    '7h the refusal is shown IN the dialog and names who', refused.say.slice(0, 90));
  const noneYet = await page.evaluate(async () =>
    ((await (await fetch('/api/outbox')).json()).items || [])
      .filter(r => /negotiation memo|f\u00f6rhandlingsnotatet/i.test(String(r.subject || ''))).length);
  check(noneYet === 0, '7i and nothing left the building', String(noneYet));

  /* ---- NOW THE COLLEAGUE WHO CAN ---- */
  const picked = await page.evaluate(async () => {
    const sel = document.getElementById('ng-memo-who');
    if (!sel) return false;                       /* no dialog: report, never throw */
    const opt = Array.from(sel.options).find(o => /everything@/.test(o.textContent));
    if (!opt) return false;
    sel.value = opt.value; return true;
  });
  if (picked){
    await page.fill('#ng-memo-note', 'Before Friday please');
    await page.click('#ng-memo-go');
    await page.waitForTimeout(1800);
  }
  const closed = await page.locator('#ng-memo-go').count() === 0;
  check(picked && closed, '7j the dialog closes when it has answered');
  const toast = await page.evaluate(() => {
    const r = document.getElementById('toast-root'); return r ? r.innerText.trim() : ''; });
  /* "SENT" HAS TO MEAN SENT. There is no provider on this server, so the only
     honest answer is the outbox — and the reader is told exactly that rather
     than being told it went. */
  check(/outbox|utkorg/i.test(toast), '7k and says honestly that it is in the outbox, not that it went',
    toast.replace(/\n/g, ' | ').slice(0, 90));

  /* READ THE MESSAGE ITSELF BACK, never the newest row: the seeded workspace
     already put three welcome emails in this outbox, and a probe that trusts
     position passes on somebody else's mail. */
  const sentMsg = await page.evaluate(async () => {
    const j = await (await fetch('/api/outbox')).json();
    const rows = (j.items || []).filter(r => /negotiation memo|f\u00f6rhandlingsnotatet/i.test(String(r.subject || '')));
    return { n: rows.length, top: rows[0] || null };
  });
  check(sentMsg.n === 1, '7l exactly one memo was queued', String(sentMsg.n));
  if (sentMsg.top){
    check(String(sentMsg.top.to_addr) === 'everything@example.co.ke',
      '7m to the colleague’s own address on file', String(sentMsg.top.to_addr));
    const body = String(sentMsg.top.body || '');
    check(/Before Friday please/.test(body), '7n the sender’s own note travelled');
    /* THE MEMO THAT WENT IS THE MEMO ON SCREEN. One text builder, and this is
       the only place that claim can be checked from both ends at once. */
    const sections = ['Agreed', 'Still open', 'We gave up', 'Blocking the deal'];
    const inBoth = sections.filter(w =>
      body.toLowerCase().includes(w.toLowerCase()) && panelText.toLowerCase().includes(w.toLowerCase()));
    check(inBoth.length === sections.length,
      '7o and it carries the same four sections the panel shows', inBoth.join(', '));
    /* AND THE WORDING TRAVELLED, not the card's shorthand — the whole point of
       what the owner asked for, checked at the far end. */
    check(/ninety \(90\) days notice/.test(body),
      '7p the full wording travelled, spelled out for an inbox');
    check(/Ninety days is what our board approved/.test(body),
      '7q and the reason with it');
    check(/#contract=/.test(body), '7r with a way back into the agreement');
  }

  /* ============ 8. THE SEND CHANGED NOTHING EITHER ============ */
  const afterSend = await page.evaluate(id => {
    const c = state.contracts.find(x => x.id === id);
    return JSON.stringify((c.changes || []).map(x => [x.id, x.status, !!x.withdrawn]));
  }, built.id);
  check(afterSend === before.json, '8a sending the memo moved nothing on the record');

  console.log(failures ? `\n${failures} FAILED` : '\nall checks passed');
  await browser.close();
  await h.stop();
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
