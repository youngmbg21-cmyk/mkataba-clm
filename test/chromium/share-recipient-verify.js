/* Chromium verification: THE SIGNING ROUTE NAMES THE RECIPIENT.
   ============================================================
   Reported (Young, 11 Aug 2026): the counterparty signer was added to the
   signing route — Juno Limited's CFO, at her own address — the route was saved,
   Share was opened, and the recipient box arrived carrying a DIFFERENT address:
   the one an earlier round had gone to. The dialog even said "Filled in from
   the last time you shared this contract."

   f182 proves the order in jsdom. This file asks the question the owner asked:
   OPEN THE DIALOG AND LOOK. It drives the real screen against the real server,
   with a real earlier share on the record, and reads the box the sender reads.

   Also measured, because the same mismatch runs down the whole journey:
     · the signer row the address came from opens already chosen, so the link
       binds to the person it is addressed to;
     · Key terms says out loud when the two records disagree, and says nothing
       when they agree;
     · the phone's share sheet fills from the same answer instead of opening
       blank on a contract the app can already address.

   Run: node test/chromium/share-recipient-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'share-recipient');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

const GMAIL = 'juno.contracts@gmail.com';
const YAHOO = 'cfo.juno@yahoo.com';
const ROUTE = [
  { id: 'sg_cfo', party: 'counterparty', name: 'Amina Juma', role: 'CFO', email: YAHOO, order: 1, signed: false },
  { id: 'sg_us', party: 'internal', name: 'Amina Otieno', role: 'Director', email: 'admin@example.co.ke', order: 2, signed: false },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];

  const login = async page => {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);
  };

  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(e.message));

  try {
    await login(page);

    /* ---- the reported set-up, built on the server the app is talking to ----
       An earlier round really went to the gmail address (a share row exists),
       Key terms really carries it, and the route really names somebody else. */
    const cid = await page.evaluate(async ({ route, gmail }) => {
      const c = state.contracts.find(x => x.status !== 'Signed') || state.contracts[0];
      c.counterparty = 'Juno Limited';
      c.counterpartyEmail = gmail;
      c.signerPlan = JSON.parse(JSON.stringify(route));
      state.activeId = c.id; state.selId = c.id;
      persist(c);
      await flushSaves();
      const payload = await buildSharePayload(c, 'deadbeef', null, { purpose: 'negotiate' });
      await api('shares', 'POST', { payload, channel: 'email',
        recipient: { name: 'Juno Contracts', email: gmail },
        expiryDays: 14, durable: true, purpose: 'negotiate' });
      return c.id;
    }, { route: ROUTE, gmail: GMAIL });

    /* The dialog has three steps: what kind of link, what am I sending (which is
       where the signer route is drawn), then the send form (which is where the
       recipient box is). A box measured while its step is folded away measures
       nothing, so each is read on its own step. */
    const openShare = async purpose => {
      await page.evaluate(() => { if (window.closeModal) closeModal(); });
      await page.waitForTimeout(300);
      await page.evaluate(([id, p]) => openShareModal(getContract(id), { purpose: p }), [cid, purpose]);
      await page.waitForTimeout(1600);
      await page.evaluate(() => { const b = document.getElementById('share-kind-next'); if (b) b.click(); });
      await page.waitForTimeout(900);
    };
    /* ONE SCREEN since 13 Sep 2026 — the send form is already on it. Kept as a
       named step so every caller below still reads as a journey, and still
       presses the button where the two-screen shape survives behind the quiet
       door. */
    const toSendForm = async () => {
      await page.evaluate(() => { const b = document.getElementById('share-next'); if (b) b.click(); });
      await page.waitForTimeout(700);
    };

    const readBox = () => page.evaluate(() => {
      const e = document.getElementById('sh-email'), n = document.getElementById('sh-name');
      /* The source rides on the box since the pop-up diet (13 Sep 2026); the
         sentence that used to say it is not drawn, and `said` is what the
         dialog prints ABOVE the box — nothing, by the owner's word. */
      const note = document.getElementById('sh-prefill-note');
      const box = e ? e.getBoundingClientRect() : null;
      return { email: e ? e.value : null, name: n ? n.value : null,
        src: e ? e.getAttribute('data-prefill-src') : null,
        said: note ? note.textContent.replace(/\s+/g, ' ').trim() : '',
        visible: !!box && box.width > 0 && box.height > 0 };
    });

    /* ================= 1. THE REPORTED SCREEN ============================== */
    await openShare('sign');
    /* the row it came from is the row the link binds to — read on the step that
       draws it, where a reader would actually see it */
    const bound = await page.evaluate(() => {
      const row = document.querySelector('[data-share-signer="sg_cfo"]');
      if (!row) return null;
      const r = row.getBoundingClientRect();
      return { said: row.textContent.replace(/\s+/g, ' ').trim(),
        w: Math.round(r.width), h: Math.round(r.height) };
    });
    await page.screenshot({ path: path.join(OUT, '01a-who-signs.png') });
    await toSendForm();
    const signBox = await readBox();
    await page.screenshot({ path: path.join(OUT, '01-sign-link.png') });

    check('the recipient box is on screen at all', signBox.visible);
    check('a Sign link is addressed to the signer on the route',
      signBox.email === YAHOO, signBox.email);
    check('and it does NOT arrive carrying the older address',
      signBox.email !== GMAIL, signBox.email);
    check('the name comes from the same row', signBox.name === 'Amina Juma', signBox.name);
    check('and the box carries which record filled it in',
      signBox.src === 'route' && signBox.said === '', signBox.src + ' / ' + signBox.said.slice(0, 90));
    check('the old sentence is not printed over an address it did not supply',
      !/last time you shared/i.test(signBox.said));

    check('the signer row it came from opens already chosen',
      !!bound && /this link/i.test(bound.said), bound ? bound.said.slice(0, 80) : 'no row');
    check('and it is a real, pressable box', !!bound && bound.w > 0 && bound.h > 0,
      bound ? `${bound.w}x${bound.h}` : 'absent');

    /* pressing it releases the binding — the picker still has a way back */
    await page.evaluate(() => { const b = document.getElementById('share-back'); if (b) b.click(); });
    await page.waitForTimeout(500);
    await page.evaluate(() => document.querySelector('[data-share-signer="sg_cfo"]').click());
    await page.waitForTimeout(400);
    check('pressing it still releases the binding',
      !/this link/i.test(await page.evaluate(() =>
        (document.querySelector('[data-share-signer="sg_cfo"]') || {}).textContent || '')));

    /* ================= 2. THE OTHER PURPOSES ============================== */
    await openShare('negotiate');
    await toSendForm();
    const negoBox = await readBox();
    check('a Negotiate link is prefilled from the route too',
      negoBox.email === YAHOO, negoBox.email);
    check('and says so there as well', negoBox.src === 'route', String(negoBox.src));

    /* ================= 3. WITH NO ROUTE, NOTHING MOVED ==================== */
    await page.evaluate(id => { const c = getContract(id); c.signerPlan = []; persist(c); }, cid);
    await page.waitForTimeout(300);
    await openShare('negotiate');
    await toSendForm();
    const noRoute = await readBox();
    await page.screenshot({ path: path.join(OUT, '02-no-route.png') });
    check('with no route, the last link we sent still answers',
      noRoute.email === GMAIL, noRoute.email);
    check('and the source is the last link, said by the box alone',
      noRoute.src === 'last' && noRoute.said === '', noRoute.src + ' / ' + noRoute.said.slice(0, 80));

    /* ================= 4. KEY TERMS NEVER DISAGREES QUIETLY =============== */
    await page.evaluate(() => { if (window.closeModal) closeModal(); });
    await page.evaluate(([id, route]) => {
      const c = getContract(id);
      c.signerPlan = JSON.parse(JSON.stringify(route));
      persist(c);
      setView('workspace');
    }, [cid, ROUTE]);
    await page.waitForTimeout(1500);
    await page.evaluate(() => { const t = document.querySelector('[data-ws-tab="terms"]'); if (t) t.click(); });
    await page.waitForTimeout(1200);
    /* The two addresses live in `The record` on the Overview (16 Sep 2026) —
       who the contract is with is reference, so the group opens shut. Pressed
       only when it is shut, because the fold is remembered for the sitting. */
    await page.evaluate(() => {
      const h = document.querySelector('[data-sec-toggle$=".record"]');
      if (h && h.getAttribute('aria-expanded') !== 'true') h.click();
    });
    await page.waitForTimeout(700);

    const kt = await page.evaluate(() => {
      const row = document.querySelector('[data-kt-row="cpRouteEmail"]');
      if (!row) return { there: false };
      const r = row.getBoundingClientRect();
      return { there: true, said: row.textContent.replace(/\s+/g, ' ').trim(),
        w: Math.round(r.width), h: Math.round(r.height) };
    });
    await page.screenshot({ path: path.join(OUT, '03-key-terms.png') });
    check('Key terms shows the route address when the two disagree',
      kt.there && kt.said.includes(YAHOO), kt.said ? kt.said.slice(0, 110) : 'no row');
    check('and it is visible pixels, not markup', kt.there && kt.w > 0 && kt.h > 0,
      kt.there ? `${kt.w}x${kt.h}` : 'absent');
    check('and it names the signer and says which links go there',
      kt.there && /Amina Juma/.test(kt.said) && /signing links go to this address/i.test(kt.said));

    /* and it goes quiet when they agree — a row repeating the line above it is
       furniture, which is the rule this codebase already holds itself to */
    const agreed = await page.evaluate(([id, yahoo]) => {
      const c = getContract(id);
      c.counterpartyEmail = yahoo; persist(c);
      if (window.renderKeyTerms) renderKeyTerms(c);
      return !document.querySelector('[data-kt-row="cpRouteEmail"]');
    }, [cid, YAHOO]);
    check('and it is absent when the two records agree', agreed);

    /* ================= 4b. THE FIRST FRAME IS THE SEND, AND THE RECORD IS
       ITS OWN LINK ================= (Young, 13 Sep 2026: "when I ask to send
       negotiation history i get the contract instead. When i click the share
       button, image 2 flashes quickly before image 3 appears.")
       The share list fetch is held for 700ms so the first frame can be
       measured while it is still the only thing on screen. */
    await page.evaluate(() => { if (window.closeModal) closeModal(); });
    await page.waitForTimeout(300);
    /* A record to send: one change filed through the product's own funnel, so
       the history card is a live choice. */
    await page.evaluate(async id => {
      const c = getContract(id); await ensureFull(c);
      if (!c.redlineText){ c.redlineText = '<h4>1. Payment</h4><p>The Buyer pays within thirty days.</p><h4>2. Term</h4><p>One year from signing.</p>'; c.format = 'rich'; }
      negoInit(c); const cl = negoClauseList(c)[0];
      await negoEditClause(c, cl.clauseId, '<p>The Buyer pays within forty-five days.</p>',
        { side: 'counterparty', author: 'Erik Lindqvist · Juno Limited', summary: 'Net-45' });
      persist(c); await flushSaves();
    }, cid);
    await page.route('**/api/contracts/*/shares', async route => {
      await new Promise(r => setTimeout(r, 700)); await route.continue(); });
    const frames = await page.evaluate(async id => {
      const root = document.getElementById('modal-root');
      const vis = sel => { const el = root.querySelector(sel); if (!el) return null;
        const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
      const read = () => ({ kind: vis('#share-step-kind'), send: vis('#share-step-1'), form: vis('#share-step-2'),
        email: vis('#sh-email'), other: vis('#share-other'), signers: vis('#share-signers'),
        sendDisabled: !!(root.querySelector('#share-send') || {}).disabled,
        width: Math.round((root.querySelector('.modal-in') || { getBoundingClientRect: () => ({ width: 0 }) }).getBoundingClientRect().width) });
      const p = openShareModal(getContract(id));          // the plain Share button: no options
      await new Promise(r => setTimeout(r, 150));
      const first = read();
      const typed = document.getElementById('sh-name'); if (typed) typed.value = 'Typed while loading';
      await p;
      await new Promise(r => setTimeout(r, 250));
      const settled = read();
      settled.name = (document.getElementById('sh-name') || {}).value;
      return { first, settled };
    }, cid);
    await page.unroute('**/api/contracts/*/shares');
    check('4b. the first frame is the send, not the kind question',
      frames.first.send === true && frames.first.form === true && frames.first.kind === false,
      JSON.stringify(frames.first));
    check('4b. the address box and the quiet door are on it from the first frame',
      frames.first.email === true && frames.first.other === true);
    check('4b. Send is greyed until the dialog is wired, then live',
      frames.first.sendDisabled === true && frames.settled.sendDisabled === false);
    check('4b. the frame does not change width when the fetch lands',
      frames.first.width > 600 && frames.first.width === frames.settled.width,
      `${frames.first.width} → ${frames.settled.width}`);
    check('4b. the settled screen is the same screen',
      frames.settled.send === true && frames.settled.kind === false, JSON.stringify(frames.settled));
    check('4b. what was typed into the first frame survives the fill',
      frames.settled.name === 'Typed while loading', frames.settled.name);

    /* The history journey, pressed for real, on a contract whose address
       already holds a standing negotiate link (built in the set-up above). */
    await page.click('#share-other');
    await page.waitForTimeout(200);
    const cardLive = await page.evaluate(() => { const b = document.querySelector('[data-share-kind="history"]'); return !!b && !b.disabled; });
    check('4b. the history card is a live choice on a contract with a record', cardLive);
    if (cardLive) await page.click('[data-share-kind="history"]');
    await page.click('#share-kind-next');
    await page.waitForTimeout(300);
    const hist = await page.evaluate(() => {
      const root = document.getElementById('modal-root');
      const vis = sel => { const el = root.querySelector(sel); if (!el) return null;
        const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
      return { signers: vis('#share-signers'), note: vis('#share-hist-note'), purpose: vis('#share-purpose-wrap'),
        preview: vis('#share-hist-preview'), text: root.innerText.replace(/\s+/g, ' ') };
    });
    await page.screenshot({ path: path.join(OUT, '05-history-send.png') });
    const rdy = await page.evaluate(() => {
      const w = document.getElementById('share-readiness-wrap'), p = document.getElementById('share-readiness');
      const r = p ? p.getBoundingClientRect() : null;
      return { drawn: !!p, visible: !!r && r.width > 0 && r.height > 0, wrap: !!w };
    });
    check('4b. the contract\'s "worth checking" fold is off the history screen', rdy.wrap && !rdy.visible, JSON.stringify(rdy));
    const leadTitle = await page.evaluate(() => (document.getElementById('share-lead-title') || {}).textContent || '');
    check('4b. the title says the history is being sent', /negotiation history to Juno Limited/.test(leadTitle) && !/round/i.test(leadTitle), leadTitle.trim());
    check('4b. the history screen draws no signing route', hist.signers === false && !/WHO SIGNS/i.test(hist.text));
    check('4b. and says it is the record', hist.note === true && hist.purpose === false);
    const before = await page.evaluate(async id => (await api('contracts/' + id + '/shares')).shares
      .map(s => ({ token: s.token, purpose: s.purpose, email: s.recipientEmail })), cid);
    await page.evaluate(gmail => { document.getElementById('sh-email').value = gmail; }, GMAIL);
    await page.click('[data-share-ch="link"]');
    await page.click('#share-send');
    await page.waitForTimeout(1500);
    const after = await page.evaluate(async id => (await api('contracts/' + id + '/shares')).shares
      .map(s => ({ token: s.token, purpose: s.purpose, email: s.recipientEmail })), cid);
    const nego = before.find(s => s.purpose === 'negotiate' && s.email === GMAIL);
    const made = after.find(s => s.purpose === 'history');
    check('4b. the record went out on its own link, the contract link untouched',
      !!made && !!nego && made.token !== nego.token && after.some(s => s.token === nego.token && s.purpose === 'negotiate'),
      JSON.stringify({ before: before.map(s => s.purpose), after: after.map(s => s.purpose) }));
    const opened = made ? await page.evaluate(async t => {
      const r = await fetch('/api/shares/' + t); const j = await r.json();
      return { status: r.status, historyOnly: j.historyOnly, purpose: j.purpose,
        wording: !!(j.payload && j.payload.contract && (j.payload.contract.docText || j.payload.contract.redlineText)) };
    }, made.token) : null;
    check('4b. and what that link serves is the history, not the contract',
      !!opened && opened.status === 200 && opened.historyOnly === true && opened.purpose === 'history' && opened.wording === false,
      JSON.stringify(opened));

    /* ---- and by WORD FILE the record is the report (Young, 13 Sep 2026) ---- */
    await page.evaluate(() => { if (window.closeModal) closeModal(); });
    await page.waitForTimeout(300);
    await page.evaluate(id => openShareModal(getContract(id)), cid);
    await page.waitForTimeout(1500);
    await page.click('#share-other');
    await page.waitForTimeout(200);
    await page.click('[data-share-kind="history"]');
    await page.click('#share-kind-next');
    await page.waitForTimeout(300);
    await page.click('[data-share-ch="word"]');
    await page.waitForTimeout(200);
    const wordNote = await page.evaluate(() => (document.getElementById('sh-ch-note') || {}).textContent || '');
    check('4b. on the record the Word line says it is the history report', /negotiation history/i.test(wordNote) && !/changes tracked|answer comes back/i.test(wordNote), wordNote);
    await page.evaluate(gmail => { document.getElementById('sh-email').value = gmail; }, GMAIL);
    await page.screenshot({ path: path.join(OUT, '06-history-word.png') });
    await page.click('#share-send');
    await page.waitForTimeout(2500);
    const mail = await page.evaluate(async () => {
      const ob = await api('outbox');
      const items = (ob.items || []).filter(m => /docx/.test(String(m.detail || '')));
      const m = items[0] || null;
      return m ? { subject: m.subject, detail: m.detail, body: String(m.body || '').slice(0, 400) } : null;
    });
    /* ---- and the NEXT open still starts on Email (Young, 13 Sep 2026: the
       highlight "starts at email and then glitches and jumps to word") ---- */
    await page.evaluate(() => { if (window.closeModal) closeModal(); });
    await page.waitForTimeout(300);
    await page.evaluate(id => openShareModal(getContract(id)), cid);
    await page.waitForTimeout(1500);
    const litCh = await page.evaluate(() => {
      const lit = Array.from(document.querySelectorAll('[data-share-ch]')).find(b => /var\(--color-accent\)/.test(b.style.background));
      return lit ? lit.getAttribute('data-share-ch') : null;
    });
    check('4b. after a Word send the dialog still opens on Email, and stays there', litCh === 'email', litCh);
    check('4b. the Word send of the record attaches the history report, not the redline',
      !!mail && new RegExp(cid + '-negotiation-history\\.docx').test(String(mail.detail)) && /negotiation history/i.test(mail.subject) && !/mark it up/i.test(mail.body),
      JSON.stringify(mail));

    check('no page errors on the desktop journey', errors.length === 0,
      errors.join(' | ') || 'clean');

    /* ================= 5. THE PHONE ASKS THE SAME QUESTION ================ */
    await ctx.close();
    const mctx = await browser.newContext({ viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const mpage = await mctx.newPage();
    const merrors = [];
    mpage.on('pageerror', e => merrors.push(e.message));
    await login(mpage);
    const mBox = await mpage.evaluate(([id, gmail]) => {
      const c = state.contracts.find(x => x.id === id);
      c.counterpartyEmail = gmail;          // put the disagreement back
      state.activeId = id;
      window.mGo('contract');
      window.mOpenShareSheet();
      const el = document.getElementById('m-share-email');
      if (!el) return { there: false };
      const r = el.getBoundingClientRect();
      return { there: true, value: el.value, w: Math.round(r.width), h: Math.round(r.height) };
    }, [cid, GMAIL]);
    await mpage.screenshot({ path: path.join(OUT, '04-phone-share.png') });
    check('the phone share sheet has a recipient box on screen',
      mBox.there && mBox.w > 0 && mBox.h > 0, mBox.there ? `${mBox.w}x${mBox.h}` : 'absent');
    check('and it opens filled from the signing route, not blank',
      mBox.value === YAHOO, mBox.value);
    check('no page errors on the phone', merrors.length === 0, merrors.join(' | ') || 'clean');
    await mctx.close();
  } finally {
    await browser.close();
    await h.stop();
  }

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) { console.log('FAILED:'); failed.forEach(f => console.log(' - ' + f.name + ' — ' + f.detail)); }
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
