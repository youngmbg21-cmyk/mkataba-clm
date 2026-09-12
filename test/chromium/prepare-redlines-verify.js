/* "PREPARE REDLINES" — driven where the reader stands
   =====================================================
   A12 (WORKORDER-contract-graph-nodes.md Part B), 11 Sep 2026. One press on
   the negotiation page runs the playbook review and files every proposed
   wording as an unsent draft of ours, one card each.

   WHY THIS FILE EXISTS AND f295 IS NOT ENOUGH. f295 drives the runner in a
   world and greps what it may reach for. It cannot ask the five things that
   decide whether the feature works from the reader's chair:
     · is the row in the More menu VISIBLE PIXELS once the menu is open
       (f180's rule — a verb in the DOM and not on screen is not a verb);
     · does a real press raise the confirm naming the cost, and does the
       confirm's press put CARDS under "Your drafts" on the real column;
     · was NOTHING sent — the counterparty's own page, opened from a real
       share link before and after, reads the same;
     · does a second press file nothing new, on the real walls;
     · and does the whole journey leave the page with no error.

   Every driven half is GUARDED: a build without the feature must REPORT its
   failures rather than time out on a click that finds no target.
   Screenshots land in test/chromium/shots/prepare-redlines/.
   Run: node test/chromium/prepare-redlines-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, startScriptedAi, seedWorkspace, FOLDER_A } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = path.join(__dirname, 'shots', 'prepare-redlines');
fs.mkdirSync(OUT, { recursive: true });

let failures = 0;
const check = (ok, what, detail) => {
  console.log((ok ? '  ok  ' : '  FAIL') + ' — ' + what + (detail != null ? ` [${detail}]` : ''));
  if (!ok) failures++;
};
const pause = ms => new Promise(r => setTimeout(r, ms));
/* A PRESS THAT REPORTS: a dead row is a finding, never a timeout.
   SCOPED TO A DOOR BY NAME since 12 Sep 2026: the act has two of them — the
   More menu's row and the empty change column's button — and a bare
   querySelector would press whichever the markup happened to put first, which
   is exactly the ambiguity that made the column's button dead in the first
   place. MENU is what sections 1 to 5 are about; COLUMN is section 6's. */
const MENU = '#ws-more-menu [data-rl-prepare]';
const COLUMN = '.rl-empty-acts [data-rl-prepare]';
const pressIn = (page, sel) => page.evaluate(s => { const b = document.querySelector(s); if (!b || b.disabled) return false; b.click(); return true; }, sel);
const pressRow = page => pressIn(page, MENU);
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

/* THEIR PAPER: an uploaded supply agreement whose wording the default playbook
   has something to say about — sixty-day payment against a 45-day standard, a
   foreign governing law, no data-protection clause — so the review proposes
   both an EDIT and an ADD. Long enough to clear the runner's 120-char floor. */
const TEXT =
  'This Supply Agreement is made between Highland Corporate Ltd and Nordkust Industri AB. '
  + '1. Supply. The Supplier shall supply the goods to the agreed specification and quality. '
  + '2. Payment. The Buyer shall pay each undisputed invoice within 60 days of receipt of the invoice. '
  + '3. Confidentiality. Each party shall keep the other party\'s information confidential. '
  + '4. Governing law. This Agreement is governed by the laws of California. ';
const BODY = '<h1>Supply Agreement</h1><p>Between Highland Corporate Ltd and Nordkust Industri AB</p>'
  + '<h2>1. Supply</h2><p>The Supplier shall supply the goods to the agreed specification and quality.</p>'
  + '<h2>2. Payment</h2><p>The Buyer shall pay each undisputed invoice within 60 days of receipt of the invoice.</p>'
  + '<h2>3. Confidentiality</h2><p>Each party shall keep the other party\'s information confidential.</p>'
  + '<h2>4. Governing law</h2><p>This Agreement is governed by the laws of California.</p>';

/* THE REVIEW, SCRIPTED at the provider: a deviation locating the payment
   clause, a standard the scan found nowhere, a foreign governing law, and one
   aligned position. What is filed for each is the LIBRARY's own preferred
   wording (the review window's lead choice), so Copilot's draft is recorded
   and never the thing on the record. */
const VERDICTS = [
  { category: 'Payment terms', status: 'deviation', quote: 'The Buyer shall pay each undisputed invoice within 60 days of receipt of the invoice.', position: '≤ 45 days',
    redline: 'The Buyer shall pay each undisputed invoice within forty-five (45) days of receipt of the invoice.', escalate: false },
  { category: 'Data protection', status: 'missing', quote: '', position: 'Data protection', redline: 'Each party shall process personal data lawfully.', escalate: false },
  { category: 'Governing law', status: 'deviation', quote: 'This Agreement is governed by the laws of California.', position: 'Home law and forum', redline: '', escalate: true },
  { category: 'Confidentiality', status: 'aligned', quote: 'Each party shall keep the other party\'s information confidential.', position: '', redline: '', escalate: false },
];

(async () => {
  const ai = await startScriptedAi();
  const h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  const W = await seedWorkspace(h);
  ai.script([{ type: 'tool_use', id: 'tu_pb', name: 'playbook_review', input: { verdicts: VERDICTS } }]);
  const ID = 'MK-A12';
  await W.admin.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: {
    id: ID, name: 'Nordkust supply agreement', counterparty: 'Nordkust Industri AB', counterpartyEmail: 'ola@nordkust.se',
    folder: FOLDER_A, status: 'Under Review', source: 'upload', template: null, fields: {}, metadata: { category: 'supplier' },
    obligations: [], audit: [], rounds: [], versions: [], signatures: [], comments: [], changes: [],
    value: 4800000, valueType: 'estimated', redlineText: BODY, format: 'rich',
    upload: { name: 'Supply_Agreement_v3.docx', extractedText: TEXT } } } });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  /* THE ONLY PLACE "IT SPENDS ONCE" CAN BE ASKED as a count of provider calls
     — with no key the review is the heuristic and no call leaves at all, so
     what is counted is that nothing was SENT: no share payload moved. */
  let payloadPuts = 0;
  page.on('request', r => { if (/\/api\/shares\/[^/]+\/payload/.test(r.url()) && r.method() === 'PUT') payloadPuts++; });

  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await pause(600);
  await page.fill('#li-email', 'admin@example.co.ke');
  await page.fill('#li-pass', 'adminpassword1');
  await page.click('#li-go');
  await pause(2400);

  /* THE COUNTERPARTY'S OWN PAGE, from a real durable negotiate link minted
     BEFORE the press — what it reads afterwards is the whole "nothing sent". */
  const tok = await page.evaluate(async id => {
    const full = await api('contracts/' + id);
    const payload = buildSharePayload(full, await sha256(canonicalDoc(full)), null, { purpose: 'negotiate' });
    const r = await api('shares', 'POST', { payload, channel: 'link', durable: true,
      recipient: { name: 'Nordkust Industri AB', email: 'ola@nordkust.se' }, purpose: 'negotiate' });
    return (r && r.token) || null;
  }, ID);
  const theirsBefore = tok ? await (await fetch(h.base + '/api/shares/' + tok)).json() : null;
  check(!!tok && !!theirsBefore, '0a their page exists, from a real link', tok);

  await page.evaluate(id => openRedlineWorkbench(id), ID);
  await pause(1800);

  /* ============ 1. THE ROW IS IN THE MENU, AND ON SCREEN ============ */
  /* RE-POINTED 12 Sep 2026. This asked for exactly ONE button on the page,
     which was right while the menu row was the only door. The owner then asked
     for the empty change column to offer the same act AND for the menu row to
     stay, so the true claim is one door in each place and nothing anywhere
     else — still a count, still falsifiable, and it now also catches a third
     copy appearing. */
  const doors = await page.evaluate(() => ({
    all: document.querySelectorAll('[data-rl-prepare]').length,
    menu: document.querySelectorAll('#ws-more-menu [data-rl-prepare]').length,
    column: document.querySelectorAll('.rl-empty-acts [data-rl-prepare]').length }));
  const hasRow = doors.menu === 1;
  check(hasRow && doors.column === 1 && doors.all === 2,
    '1a one row in the More menu and one button in the empty column — two doors, no third', JSON.stringify(doors));
  await page.click('#ws-more');
  await pause(400);
  check(hasRow && await visible(page, MENU), '1b and once the menu is open the row is VISIBLE PIXELS');
  const row = hasRow ? await page.evaluate(s => { const b = document.querySelector(s); return { text: b.textContent.trim(), dead: b.disabled, title: b.title }; }, MENU) : { text: '', dead: true, title: '' };
  check(/prepare redlines/i.test(row.text) && !row.dead, '1c it says what it is and is live on a readable draft', JSON.stringify(row));
  check(/nothing goes to the other side/i.test(row.title), '1d its hover says nothing is sent', row.title);
  check(hasRow && await visible(page, '[data-rl-memo]') && await visible(page, '[data-rl-pbreview]'), '1e beside the memo and the playbook pass');
  await page.screenshot({ path: path.join(OUT, '01-menu.png') });

  /* ============ 2. THE PRESS ASKS BEFORE IT SPENDS ============ */
  const before = await page.evaluate(id => { const c = state.contracts.find(x => x.id === id);
    return { changes: (c.changes || []).length, turnAt: (c.negotiation || {}).turnAt || null, drafts: document.querySelector('[data-rl-band="drafts"] b') ? Number(document.querySelector('[data-rl-band="drafts"] b').textContent) : 0 }; }, ID);
  const pressed = await pressRow(page); await pause(700);
  check(pressed, '2- the row could be pressed');
  const ask = await page.evaluate(() => { const ok = document.getElementById('cf-ok'); const msg = ok && ok.closest('[role="dialog"], .modal, div');
    const text = ok ? (ok.closest('[role="dialog"]') || ok.parentElement.parentElement).innerText : ''; return { there: !!ok, text }; });
  check(ask.there, '2a a real press raises the confirm dialog');
  check(/one deep Copilot call/i.test(ask.text) && /nothing is sent/i.test(ask.text), '2b and the sentence names the cost and says nothing is sent', ask.text.slice(0, 160));
  await page.screenshot({ path: path.join(OUT, '02-ask.png') });
  /* REFUSING WRITES NOTHING. */
  if (ask.there){ await page.click('#cf-cancel'); await pause(500); }
  const refused = await page.evaluate(id => { const c = state.contracts.find(x => x.id === id); return { changes: (c.changes || []).length, review: !!c.playbook }; }, ID);
  check(refused.changes === before.changes && !refused.review, '2c refusing the dialog files nothing and runs no review', JSON.stringify(refused));

  /* ============ 3. THE PRESS FILES THE DRAFTS ============ */
  await page.click('#ws-more'); await pause(300);
  await pressRow(page); await pause(700);
  if (await page.locator('#cf-ok').count()){ await page.click('#cf-ok'); }
  await pause(2500);
  const after = await page.evaluate(id => {
    const c = state.contracts.find(x => x.id === id);
    const band = document.querySelector('[data-rl-band="drafts"]');
    const toast = document.getElementById('toast-root'); const t = toast ? toast.innerText : '';
    const drafts = (c.changes || []).filter(x => x.status === 'pending' && x.authorSide === 'owner' && !x.withdrawn);
    return { changes: (c.changes || []).length, drafts: drafts.length, types: drafts.map(x => x.changeType).sort(),
      band: band ? Number(band.querySelector('b').textContent) : 0, bandOn: !!band && band.getBoundingClientRect().height > 0,
      unsent: typeof negoUnsentAsks === 'function' ? negoUnsentAsks(c, 'owner').length : -1,
      turnAt: (c.negotiation || {}).turnAt || null, review: !!(c.playbook && c.playbook.verdicts && c.playbook.verdicts.length),
      toast: t, audit: (c.audit || []).filter(a => /Redlines prepared/.test(a.detail || '')).map(a => a.detail),
      cardsOnScreen: document.querySelectorAll('[data-rl-band="drafts"] ~ *').length };
  }, ID);
  await page.screenshot({ path: path.join(OUT, '03-drafts.png') });
  check(after.drafts >= 2 && after.drafts === after.changes, '3a the press filed the drafts — every change on the record is a pending draft of ours', JSON.stringify({ drafts: after.drafts, types: after.types }));
  check(after.types.includes('modify') && after.types.includes('insertClause'), '3b an edit of a located clause AND a missing standard added', after.types.join(','));
  check(after.bandOn && after.band === after.drafts, '3c the cards sit under "Your drafts" on the real column, and the band\'s count is the record\'s', `band ${after.band} vs ${after.drafts}`);
  check(after.unsent === after.drafts && after.turnAt === before.turnAt, '3d and NONE was sent — every draft still waits on Send and the turn never moved', JSON.stringify({ unsent: after.unsent, turnAt: after.turnAt }));
  check(after.review, '3e the review is on the record, as the review window leaves it');
  check(new RegExp(after.drafts + ' drafts filed under Your drafts — nothing sent').test(after.toast), '3f one toast says what happened, with the count', after.toast.trim().slice(0, 120));
  check(after.audit.length === 1 && new RegExp(after.drafts + ' drafts filed unsent').test(after.audit[0]), '3g one English audit line names the count', after.audit[0]);
  const calls1 = ai.calls.length;
  check(calls1 === 1, '3i and exactly ONE deep Copilot call was spent for it', String(calls1));
  /* NO BAND, STRIP OR NOTICE anywhere: the column repainting is the confirmation. */
  const strips = await page.evaluate(() => document.querySelectorAll('.rl-notices > *:not(#rl-banner), .rl-plan, .rl-unsent').length);
  check(strips === 0, '3h and nothing was added to the page — no band, strip or notice', String(strips));

  /* ============ 4. THE COUNTERPARTY'S PAGE DID NOT CHANGE ============ */
  const theirsAfter = tok ? await (await fetch(h.base + '/api/shares/' + tok)).json() : null;
  const pick = p => p && p.payload ? JSON.stringify({ changes: (p.payload.contract && p.payload.contract.changes || []).map(x => x.id), body: (p.payload.contract || {}).redlineText || '', at: p.payload.at }) : '';
  check(!!theirsAfter && pick(theirsBefore) === pick(theirsAfter) && payloadPuts === 0, '4a their link serves the same payload it did before the press — nothing travelled', `puts ${payloadPuts}`);
  const cp = await ctx.newPage();
  cp.on('pageerror', e => errors.push('counterparty: ' + e.message));
  await cp.goto(h.base + '/#share=t:' + tok, { waitUntil: 'networkidle' });
  await pause(2800);
  const onTheirs = await cp.evaluate(() => ({ cards: document.querySelectorAll('[data-rl-origin]').length, text: document.body.innerText }));
  check(onTheirs.cards === 0 && !/data protection/i.test(onTheirs.text), '4b and their page shows no draft of ours — no card, and no clause the drafts would add', `cards ${onTheirs.cards}`);
  await cp.screenshot({ path: path.join(OUT, '04-theirs.png') });
  await cp.close();

  /* ============ 5. A SECOND PRESS FILES NOTHING NEW ============ */
  await page.click('#ws-more'); await pause(300);
  await pressRow(page); await pause(700);
  const ask2 = await page.evaluate(() => { const ok = document.getElementById('cf-ok'); return ok ? (ok.closest('[role="dialog"]') || ok.parentElement.parentElement).innerText : ''; });
  check(/already on file/i.test(ask2) && /costs nothing/i.test(ask2), '5a the second ask says the review is on file and the press costs nothing', ask2.slice(0, 120));
  if (await page.locator('#cf-ok').count()){ await page.click('#cf-ok'); }
  await pause(2000);
  const again = await page.evaluate(id => {
    const c = state.contracts.find(x => x.id === id);
    const drafts = (c.changes || []).filter(x => x.status === 'pending' && x.authorSide === 'owner' && !x.withdrawn);
    return { changes: (c.changes || []).length, drafts: drafts.length, revisions: drafts.reduce((a, x) => a + ((x.revisions || []).length), 0),
      band: document.querySelector('[data-rl-band="drafts"] b') ? Number(document.querySelector('[data-rl-band="drafts"] b').textContent) : 0,
      toast: (document.getElementById('toast-root') || {}).innerText || '' };
  }, ID);
  check(again.changes === after.changes && again.drafts === after.drafts && again.revisions === 0 && again.band === after.band,
    '5b nothing new is filed and nothing is revised — the walls refused, not a pre-filter', JSON.stringify(again));
  check(/No drafts were filed — \d+ already here/.test(again.toast), '5c and the toast says why', again.toast.trim().slice(0, 120));
  check(ai.calls.length === calls1, '5d and the second press spent nothing — the review on file was used', String(ai.calls.length));
  await page.screenshot({ path: path.join(OUT, '05-second-press.png') });

  /* ============ 6. THE EMPTY COLUMN IS A DOOR (Young asked 12 Sep 2026) ============
     The audit's first finding: the one screen with nothing to read described
     the work instead of offering it. Both acts existed already, so what is
     asked here is whether a reader can now PRESS them — which is the half no
     amount of grepping answers, and the half that was broken the moment the
     act had two doors and one singular query.

     STAGED BY EMPTYING THE COLUMN, the state this is entirely about: the
     drafts filed above are cleared off the record so the page draws the state
     a reader meets on a freshly received contract. */
  await page.evaluate(id => { const c = state.contracts.find(x => x.id === id); c.changes = []; renderRedline(); }, ID);
  await pause(900);
  const emptyDoors = await page.evaluate(() => {
    const box = document.querySelector('.rl-cards-empty');
    const acts = document.querySelector('.rl-empty-acts');
    const seen = el => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const btns = acts ? [...acts.querySelectorAll('button')] : [];
    return { box: !!box, acts: !!acts, n: btns.length,
      labels: btns.map(b => b.textContent.trim()), dead: btns.map(b => !!b.disabled),
      onScreen: btns.map(seen), lead: (document.querySelector('.rl-empty-lead') || {}).textContent || '',
      /* THE SENTENCE THE BUTTONS REPLACE must be gone from this state — a door
         AND a paragraph describing the door is the fault printed twice. */
      blurb: /Press the .{0,3} Edit/i.test(box ? box.textContent : '') };
  });
  check(emptyDoors.box && emptyDoors.acts && emptyDoors.n === 2,
    '6a the empty column draws two buttons', JSON.stringify({ n: emptyDoors.n, labels: emptyDoors.labels }));
  check(emptyDoors.onScreen.every(Boolean) && !emptyDoors.dead.some(Boolean),
    '6b both are VISIBLE PIXELS and neither is dead on a readable draft', JSON.stringify(emptyDoors));
  check(/prepare redlines/i.test(emptyDoors.labels.join(' ')) && /edit a clause/i.test(emptyDoors.labels.join(' ')),
    '6c and they are the two acts the owner asked for', emptyDoors.labels.join(' · '));
  check(!emptyDoors.blurb && /nothing is sent until you press Send/i.test(emptyDoors.lead),
    '6d the how-to paragraph is gone and one line says what the press spends', emptyDoors.lead.slice(0, 120));
  await page.screenshot({ path: path.join(OUT, '06-empty-column.png') });

  /* THE COLUMN'S OWN PREPARE BUTTON IS WIRED — the whole point of the
     querySelectorAll fix, and unprovable anywhere but a real press. */
  const pressedCol = await pressIn(page, COLUMN); await pause(800);
  const colAsk = await page.evaluate(() => { const ok = document.getElementById('cf-ok');
    return { there: !!ok, text: ok ? (ok.closest('[role="dialog"]') || ok.parentElement.parentElement).innerText : '' }; });
  check(pressedCol && colAsk.there,
    '6e pressing the COLUMN button raises the same confirm the menu row does — one act, two doors', colAsk.text.slice(0, 90));
  if (colAsk.there){ await page.click('#cf-cancel'); await pause(500); }

  /* "EDIT A CLAUSE" OPENS THE CLAUSE EDITOR ON THE FIRST CLAUSE. */
  const pressedEdit = await page.evaluate(() => { const b = document.querySelector('[data-rl-edit-first]'); if (!b || b.disabled) return null;
    const to = b.getAttribute('data-rl-edit-first'); b.click(); return to; });
  await pause(1600);
  const edit = await page.evaluate(() => ({
    open: typeof clauseEditorOpen === 'function' ? clauseEditorOpen() : null,
    doc: !!document.getElementById('ce-doc'),
    clause: typeof window.rlFirstClauseId === 'function' ? 'read' : 'absent' }));
  check(pressedEdit === 'editor', '6f at this width the button promises the clause editor', String(pressedEdit));
  check(!!edit.open && edit.doc, '6g and the press opens it on the first clause', JSON.stringify(edit));
  await page.screenshot({ path: path.join(OUT, '07-edit-a-clause.png') });
  /* OUT AGAIN, so the last checks read the page and not the layer over it. */
  await page.evaluate(() => { if (typeof rlCloseClauseEditor === 'function') rlCloseClauseEditor(); });
  await pause(900);

  /* THEIR SEAT KEEPS THE SENTENCE. The preview draws the counterparty's own
     column, and neither act is theirs — Prepare redlines reads OUR standards
     and the editor refuses their seat by construction. */
  /* MEASURED, NOT ASSUMED. The first cut of this read a global the page does
     not have, so the evaluate threw, the guard swallowed it and both checks
     passed on null — a description, exactly what this file's own preamble
     forbids. The id comes in as an argument now and `ours` is the CONTROL:
     if our own seat stopped drawing the buttons the comparison would be
     satisfied by both seats having nothing, and this says so. */
  const theirs = await page.evaluate(id => {
    const c = state.contracts.find(x => x.id === id);
    c.changes = [];
    const read = side => {
      const html = redlineChangeCardsHtml(c, side === 'counterparty'
        ? { side: 'counterparty', readonly: true } : { side: 'owner' });
      return { acts: /rl-empty-acts/.test(html), edit: /data-rl-edit-first/.test(html),
        prepare: /data-rl-prepare/.test(html), blurb: /Press the/.test(html) };
    };
    return { ours: read('owner'), theirs: read('counterparty') };
  }, ID);
  check(theirs.ours.acts && theirs.ours.edit && theirs.ours.prepare,
    '6h- the control: our own seat really does draw both buttons', JSON.stringify(theirs.ours));
  check(!theirs.theirs.acts && !theirs.theirs.edit && !theirs.theirs.prepare,
    '6h the counterparty column draws neither button', JSON.stringify(theirs.theirs));
  check(theirs.theirs.blurb, '6i and keeps the sentence rather than an empty box', JSON.stringify(theirs.theirs));

  check(errors.length === 0, 'no page errors', errors.join(' | ') || 'clean');
  await browser.close(); await h.stop(); await ai.stop();
  console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
