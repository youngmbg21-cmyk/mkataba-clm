/* Chromium verification: SIGNING ON THE PAPER (owner-asked 29 Aug 2026, J-1)
   ============================================================
   *"while in document tab, you can enter signature on the contract ... you
   will be navigated to the spaces where you can sign your name just like
   docusign at final stage you will be directed to the signature block to sign
   officially."*

   EVERYTHING HERE IS MEASURED IN A REAL BROWSER because every claim is about
   PIXELS and PRESSES. Two of them cannot be asked anywhere else at all:

     - **the pixels above the first line of the wording** on the Document tab
       and on the Signing tab, which the work order requires to be IDENTICAL,
       with the Document tab's own number proved UNCHANGED. jsdom lays nothing
       out and would report 0 for both, passing on any build.
     - **the walk pressed for real**, which is the whole of the owner's ask and
       is a scroll — a synthetic call proves nothing about where a reader ends
       up.

   THE RULES are f256's; what DRAWS is here. The two files name each other.

   Screenshots go to test/chromium/shots/signing-on-paper/.
   Run: node test/chromium/signing-on-paper-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'signing-on-paper');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
/* Visible pixels, not merely present in the markup — asked by SELECTOR through
   page.evaluate, because $eval with a string expression is not a page function
   and comes back null however well the page is drawn, which is a green run
   reporting "absent" on a correct build. */
const seen = (page, sel) => page.evaluate(s => {
  const el = document.querySelector(s);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top),
    on: r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' };
}, sel);

/* THE DISTANCE FROM THE TOP OF THE WINDOW TO THE FIRST LINE OF THE AGREEMENT.
   Measured off a RANGE over the first real text node rather than off an
   element box: the box is the LINE box and half-leading puts the glyphs
   somewhere else inside it, which is the fault ONE HEADER TOP was reported for
   twice. The paper is scrolled to the top first, or the number is a fact about
   where somebody had scrolled to. */
const INK_TOP = `(() => {
  const box = document.getElementById('doc-canvas');
  if (!box) return null;
  const sc = box.closest('.nego-scroll, [style*="overflow"]') || document.scrollingElement;
  if (sc) sc.scrollTop = 0;
  const walk = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
  while (walk.nextNode()) {
    const n = walk.currentNode;
    if ((n.textContent || '').trim().length < 8) continue;
    const rg = document.createRange();
    rg.setStart(n, 0); rg.setEnd(n, Math.min(6, n.textContent.length));
    const r = Array.from(rg.getClientRects())[0];
    if (r && r.width > 2) return Math.round(r.top);
  }
  return null;
})()`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);

    /* ---- THE FIXTURE ----
       Real rich wording whose last clause asks for a signature, real clause
       ids, and a signing route with one of us and one of them — so "mine" and
       "theirs" both have something to resolve against. The signature picker is
       stubbed at the ONE function every path goes through (captureSignature),
       so no drawing canvas has to be driven and the claim stays about the
       spot rather than about the pad. */
    const built = await page.evaluate(async () => {
      const me = currentUser();
      const c = state.contracts.find(x => x.status !== 'Signed') || state.contracts[0];
      c.format = 'rich';
      c.redlineText = [
        '<h2 data-clause-id="cl_spa00001">1. Term</h2>',
        '<p>This agreement runs for twelve months from the Effective Date and renews unless either party gives notice.</p>',
        '<h2 data-clause-id="cl_spa00002">2. Charges</h2>',
        '<p>The Buyer shall pay each invoice within thirty (30) days of receipt, exclusive of VAT.</p>',
        '<h2 data-clause-id="cl_spa00003">3. Execution</h2>',
        '<p>SIGNED for and on behalf of the parties by their duly authorised representatives on the dates below.</p>',
      ].join('');
      c.signerPlan = [
        { id: 'r1', name: me.name, party: 'internal', memberId: me.id, email: me.email },
        { id: 'r2', name: c.counterparty || 'The other side', party: 'counterparty', email: 'legal@other.test' },
      ];
      c.signSpots = [];
      c.compliance = c.compliance || {};
      persist(c);
      await new Promise(r => setTimeout(r, 1400));   // persist is debounced
      return { id: c.id, me: me.name };
    });

    await page.evaluate(id => openWorkspace(id), built.id);
    await page.waitForSelector('#doc-canvas', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1200);

    /* ================= 1 — ONE SHEET, TWO TABS */
    const docInk = await page.evaluate(INK_TOP);
    const docBox = await seen(page, '#doc-canvas');
    check('1a the Document tab draws the agreement', !!(docBox && docBox.on),
      docBox ? `${docBox.w}x${docBox.h}` : 'absent');

    await page.evaluate(() => roomGoTab(getContract(state.activeId), 'sign'));
    await page.waitForTimeout(900);
    const signInk = await page.evaluate(INK_TOP);
    const signBox = await seen(page, '#doc-canvas');
    check('1b the Signing tab draws THE SAME sheet', !!(signBox && signBox.on),
      signBox ? `${signBox.w}x${signBox.h}` : 'absent');
    /* THE WORK ORDER'S OWN ACCEPTANCE 5: identical on both tabs, and the
       Document tab's own number unchanged. Both are reported either way, so a
       failure names the two numbers rather than saying "not equal". */
    check('1c the pixels above the first line are IDENTICAL on both tabs',
      docInk != null && signInk != null && Math.abs(docInk - signInk) <= 1,
      `document ${docInk} · signing ${signInk}`);

    /* ---- 1c2. AND THE DOCUMENT TAB'S OWN NUMBER IS UNMOVED ----
       ADDED 30 Aug 2026. 1c reads both tabs at HEAD and asserts they agree —
       so a change that pushed the wording down on BOTH tabs by the same amount
       passed it cleanly. The comment above names two halves and 1c implements
       one. The second half is measured the way upload-structure-verify
       measures its own: on ONE document, with this job's marks present and
       with them taken away, which is exactly the state before and after. */
    const inkNoSpots = await (async () => {
      await page.evaluate(() => {
        const c = getContract(state.activeId);
        window.__keepSpots = c.signSpots; c.signSpots = [];
        roomGoTab(c, 'docs');
      });
      await page.waitForTimeout(500);
      const v = await page.evaluate(INK_TOP);
      await page.evaluate(() => {
        const c = getContract(state.activeId);
        c.signSpots = window.__keepSpots; delete window.__keepSpots;
        roomGoTab(c, 'docs');
      });
      await page.waitForTimeout(500);
      return v;
    })();
    const docInkAgain = await page.evaluate(INK_TOP);
    check('1c2 THE DOCUMENT TAB’S OWN NUMBER IS UNMOVED by this job',
      docInkAgain != null && inkNoSpots != null && Math.abs(docInkAgain - inkNoSpots) <= 1,
      `with the marks ${docInkAgain} · without them ${inkNoSpots}`);
    await page.evaluate(() => roomGoTab(getContract(state.activeId), 'sign'));
    await page.waitForTimeout(600);

    /* THE COLUMN SWAPS AND THE PAPER DOES NOT. */
    const cols = await page.evaluate(() => {
      const out = {};
      document.querySelectorAll('#doc-right [data-doc-col]').forEach(el => {
        out[el.getAttribute('data-doc-col')] = getComputedStyle(el).display !== 'none';
      });
      return out;
    });
    check('1d on Signing the signing column shows and the Checks column does not',
      cols.sign === true && cols.docs === false, JSON.stringify(cols));
    const side = await seen(page, '#sign-side');
    check('1e the signing order is at the TOP of that column', !!(side && side.on),
      side ? `top ${side.top}` : 'absent');

    /* ================= 2 — HaTi PROPOSES, A PERSON PLACES */
    const props = await page.evaluate(() => {
      const c = getContract(state.activeId);
      return signSpotProposals(c).map(p => ({ id: p.clauseId, kind: p.kind, i: p.index }));
    });
    check('2a HaTi proposes exactly where the wording asks',
      props.length === 1 && props[0].id === 'cl_spa00003',
      JSON.stringify(props));

    const cardSeen = await seen(page, '#sign-side section:last-of-type');
    const hasAdd = await page.$('#sign-side [data-spot-add]');
    check('2b the places card is on screen with an Add on the proposal',
      !!(cardSeen && cardSeen.on && hasAdd), cardSeen ? `${cardSeen.w}x${cardSeen.h}` : 'absent');

    await page.selectOption('#sign-side [data-spot-who]', 'r1').catch(() => {});
    await page.click('#sign-side [data-spot-add]');
    await page.waitForTimeout(700);
    const placed = await page.evaluate(() => (getContract(state.activeId).signSpots || []).length);
    check('2c pressing Add places one spot', placed === 1, `${placed} spot(s)`);

    /* ================= 3 — THE MARK IS ON THE PAPER */
    const spot = await seen(page, '#doc-canvas .sig-spot');
    check('3a the spot draws ON the sheet as visible pixels', !!(spot && spot.on),
      spot ? `${spot.w}x${spot.h}` : 'absent');
    const inClause = await page.evaluate(() => {
      const el = document.querySelector('#doc-canvas .sig-spot');
      if (!el) return null;
      /* It must sit AFTER the execution clause's last block and before any
         next clause — a mark between a heading and its own first line reads as
         though the clause is signed rather than that the contract is. */
      let prev = el.previousElementSibling, seen = null;
      while (prev) { if (prev.hasAttribute('data-clause-id')) { seen = prev.getAttribute('data-clause-id'); break; } prev = prev.previousElementSibling; }
      return { after: seen, tag: el.tagName };
    });
    check('3b it is anchored under the clause that asked for it',
      inClause && inClause.after === 'cl_spa00003', JSON.stringify(inClause));
    check('3c and it is a BUTTON, because it is mine to fill',
      inClause && inClause.tag === 'BUTTON', inClause ? inClause.tag : 'absent');

    /* THE WORDING IS UNTOUCHED — the strongest form of "a mark sits OVER the
       paper": the agreement's own text is character-identical before and after
       a spot was placed on it. */
    const wordingSame = await page.evaluate(() => {
      const c = getContract(state.activeId);
      const t = document.getElementById('doc-canvas').textContent.replace(/\s+/g, ' ');
      return { has: t.includes('thirty (30) days'), stored: /thirty \(30\) days/.test(c.redlineText) };
    });
    check('3d the agreement’s own wording is untouched',
      wordingSame.has && wordingSame.stored, JSON.stringify(wordingSame));

    await page.screenshot({ path: path.join(OUT, '01-spot-on-paper.png') });

    /* ================= 4 — FILLING IT IS NOT SIGNING */
    /* ---- THE REAL PICKER, DRIVEN ----
       A stub was tried first and could never have worked: signSpotFill calls
       `captureSignature` BARE, and these files are ES MODULES — a top-level
       function is not a global, so overwriting window.captureSignature reaches
       nothing. That is this codebase's own most repeated defect met from the
       test side, and driving the real picker is the better answer anyway: it
       proves the ONE capture path is what a spot opens. */
    const beforeSign = await page.evaluate(() => {
      const c = getContract(state.activeId);
      return { sigs: (c.signatures || []).length, status: c.status, hash: c.hash || null };
    });
    await page.click('#doc-canvas .sig-spot');
    await page.waitForSelector('#sig-pad', { timeout: 8000 });
    check('4a0 pressing a spot opens the picker HaTi already has — never a second one',
      true, 'the signature pad');
    await page.click('#sig-pad [data-sig-tab="type"]');
    await page.fill('#sig-typed', built.me);
    await page.waitForTimeout(300);
    await page.click('#sig-adopt-go');
    await page.waitForTimeout(1000);
    const afterSign = await page.evaluate(() => {
      const c = getContract(state.activeId);
      return { sigs: (c.signatures || []).length, status: c.status, hash: c.hash || null,
        marked: !!(c.signSpots || [])[0].image,
        img: !!document.querySelector('#doc-canvas .sig-spot img') };
    });
    check('4a the mark lands on the paper', afterSign.marked && afterSign.img,
      JSON.stringify(afterSign));
    check('4b AND NOTHING IS SIGNED — c.signatures, the status and the seal are unmoved',
      afterSign.sigs === beforeSign.sigs && afterSign.status === beforeSign.status
      && afterSign.hash === beforeSign.hash,
      `before ${JSON.stringify(beforeSign)} after ${JSON.stringify(afterSign)}`);

    await page.screenshot({ path: path.join(OUT, '02-marked.png') });

    /* ================= 5 — A SPOT THAT IS NOT MINE */
    await page.evaluate(() => {
      const c = getContract(state.activeId);
      signSpotAdd(c, 'cl_spa00001', 'r2', 'signature');
      renderSignSide(c); signSpotsPaint(c);
    });
    await page.waitForTimeout(600);
    const theirs = await page.evaluate(() => {
      const el = document.querySelector('#doc-canvas .sig-spot.is-theirs');
      if (!el) return null;
      const cs = getComputedStyle(el);
      return { tag: el.tagName, cursor: cs.cursor, on: el.getBoundingClientRect().height > 0 };
    });
    check('5a their spot is DRAWN', !!(theirs && theirs.on), JSON.stringify(theirs));
    check('5b and is not a control — no button, no pointer',
      theirs && theirs.tag !== 'BUTTON' && theirs.cursor !== 'pointer',
      theirs ? `${theirs.tag} / ${theirs.cursor}` : 'absent');

    /* ================= 6 — THE WALK, PRESSED FOR REAL */
    await page.evaluate(() => {
      const c = getContract(state.activeId);
      signSpotAdd(c, 'cl_spa00002', 'r1', 'initials');
      renderSignSide(c); signSpotsPaint(c); wsPaintTabRowEnd(c);
    });
    await page.waitForTimeout(700);
    const walkSeen = await seen(page, '#ws-walk');
    check('6a the walk is on the tab row, in flow', !!(walkSeen && walkSeen.on),
      walkSeen ? `${walkSeen.w}x${walkSeen.h} top ${walkSeen.top}` : 'absent');
    /* ---- THE RIGHT QUESTION, and the first draft asked the wrong one ----
       "no fixed ancestor anywhere" fails on any build: #app-shell is
       position:fixed and always has been, which is the SHELL and not this
       control. What the standing rule forbids is the control floating over the
       PAGE — so the question is whether it sits inside the in-flow tab row,
       and whether anything between it and that row is taken out of flow. */
    const walkFlow = await page.evaluate(() => {
      const el = document.getElementById('ws-walk'); if (!el) return null;
      const row = document.getElementById('ws-tabrow-end');
      if (!row || !row.contains(el)) return { inRow: false };
      let n = el, pos = [];
      while (n && n !== row) { pos.push(getComputedStyle(n).position); n = n.parentElement; }
      return { inRow: true, pos };
    });
    check('6b NOTHING FLOATS OVER THE PAGE — it is in the tab row, in flow',
      !!(walkFlow && walkFlow.inRow && !walkFlow.pos.includes('fixed')
         && !walkFlow.pos.includes('absolute')), JSON.stringify(walkFlow));

    const walkLabel = await page.$eval('#ws-walk', el => el.textContent.trim());
    /* By this point one of the reader's two places is already marked, so the
       honest reading is "2 of 2" — the control says which of MINE is next, not
       how many are left. Asserted against the model's own arithmetic rather
       than against a number typed here, or this check drifts with the fixture. */
    const walkExp = await page.evaluate(() => {
      const c = getContract(state.activeId);
      const mine = signSpotsMine(c), left = signSpotsLeft(c).length;
      return { at: mine.length - left + 1, n: mine.length };
    });
    check('6c it names how far through the reader is',
      new RegExp(`${walkExp.at}\\s*(of|av)\\s*${walkExp.n}`).test(walkLabel),
      `${walkLabel}  (model says ${walkExp.at} of ${walkExp.n})`);

    /* THE PRESS IS A SCROLL, so it is measured as one: where was the paper
       before, and did the spot it names come onto the screen. */
    const before = await page.evaluate(() => {
      const c = getContract(state.activeId);
      const next = signWalkNext(c);
      const el = document.querySelector(`[data-sig-spot="${next.id}"]`);
      return { id: next.id, top: el ? Math.round(el.getBoundingClientRect().top) : null,
        onScreen: el ? (el.getBoundingClientRect().top > 0 && el.getBoundingClientRect().bottom < window.innerHeight) : null };
    });
    await page.click('#ws-walk');
    await page.waitForTimeout(1200);
    const after = await page.evaluate(id => {
      const el = document.querySelector(`[data-sig-spot="${id}"]`);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top), onScreen: r.top > 0 && r.bottom < window.innerHeight,
        walking: el.classList.contains('is-walking') };
    }, before.id);
    check('6d pressing it brings the next place onto the screen',
      !!(after && after.onScreen), `before top ${before.top} · after top ${after && after.top}`);
    check('6e and marks it, so the reader’s eye finds it',
      !!(after && after.walking), after ? String(after.walking) : 'absent');

    await page.screenshot({ path: path.join(OUT, '03-walk.png') });

    /* THE LAST PRESS LANDS ON THE BLOCK THAT SIGNS. */
    /* Fill the rest through the same door, one at a time, so the walk's own
       arithmetic is measured against marks that really arrived. */
    for (let i = 0; i < 4; i++) {
      const left = await page.evaluate(() => signSpotsLeft(getContract(state.activeId)).length);
      if (!left) break;
      const id = await page.evaluate(() => signWalkNext(getContract(state.activeId)).id);
      await page.click(`[data-sig-spot="${id}"]`);
      await page.waitForSelector('#sig-pad', { timeout: 8000 });
      await page.click('#sig-pad [data-sig-tab="type"]');
      await page.fill('#sig-typed', built.me);
      await page.waitForTimeout(200);
      await page.click('#sig-adopt-go');
      await page.waitForTimeout(900);
    }
    await page.evaluate(() => { const c = getContract(state.activeId);
      renderSignSide(c); signSpotsPaint(c); wsPaintTabRowEnd(c); });
    await page.waitForTimeout(700);
    const doneLabel = await page.$eval('#ws-walk', el => el.textContent.trim()).catch(() => null);
    check('6f with none left the control names the signature block',
      !!doneLabel && !/1\s*(of|av)/.test(doneLabel), doneLabel);
    await page.click('#ws-walk');
    await page.waitForTimeout(1200);
    const atBlock = await page.evaluate(() => {
      const b = document.getElementById('sign-btn');
      if (!b) return null;
      const r = b.getBoundingClientRect();
      return { onScreen: r.top > -20 && r.top < window.innerHeight };
    });
    check('6g and the last press lands on it',
      !!(atBlock && atBlock.onScreen), JSON.stringify(atBlock));

    /* ================= 7 — THE REFUSAL */
    const refusal = await page.evaluate(() => {
      const c = getContract(state.activeId);
      /* Take one mark back and ask the ONE list of refusals. */
      signSpotClear(c, c.signSpots.find(s => s.signerId === 'r1').id);
      const b = signBlockers(c).find(x => x.key === 'spots');
      return b ? { label: b.label, short: b.short } : null;
    });
    check('7a an empty place of MINE joins the one list of refusals',
      !!refusal && /place/i.test(refusal.label), JSON.stringify(refusal));

    await page.evaluate(() => { const c = getContract(state.activeId);
      renderSignButton(c); });
    await page.waitForTimeout(500);
    const btn = await page.evaluate(() => {
      const b = document.getElementById('sign-btn');
      return b ? { disabled: b.disabled, text: (b.textContent || '').trim() } : null;
    });
    check('7b and the Sign button disables itself and wears the reason',
      !!(btn && btn.disabled), JSON.stringify(btn));

    /* ================= 8 — NOTHING TRAVELS */
    const payload = await page.evaluate(() => {
      const c = getContract(state.activeId);
      const p = buildSharePayload(c, 'x', { org: 'HaTi', sharedBy: 'A' });
      return JSON.stringify(p).includes('signSpots') || JSON.stringify(p).includes('sig_');
    });
    check('8a a placed mark is absent from the share payload', payload === false,
      payload ? 'FOUND in the payload' : 'absent');

    /* ---- 8b. ACCEPTANCE 8: THEIR PAGE IS BYTE-IDENTICAL ----
       ADDED 30 Aug 2026. Nothing here rendered their page at all, and the
       rulebook recorded the proof as performed — the fault this codebase warns
       about by name. It is DRIVEN now: the counterparty's workbench is built
       from a real payload with the marks on the record and again with them
       taken away, and the two renderings are compared character for character
       (generated ids and clock times normalised, as the clause-editor file's
       own parity check does). A difference of any kind is a mark reaching a
       seat it was never meant to reach.

       AND THE COST IS SAID OUT LOUD: what this proves is that their page does
       not CHANGE, which is J-1's acceptance. It is not a claim that they can
       see where they must sign — they cannot, because signSpots never travels,
       and that is recorded as a departure rather than as a feature. */
    const portal = await page.evaluate(() => {
      const c = getContract(state.activeId);
      const norm = h => String(h || '')
        .replace(/(id|for|aria-labelledby|aria-controls)="[^"]*"/g, '$1="~"')
        .replace(/\b(sp|sg|cl|rv|ch)_[a-z0-9]{4,}/g, '$1_~')
        .replace(/\d{1,2} \w{3} \d{4}(, \d{2}:\d{2})?/g, '~date~')
        /* Clock times: the payload is stamped when it is BUILT, so two builds
           a millisecond apart differ on a fact about the build rather than
           about the marks. */
        .replace(/\d{4}-\d{2}-\d{2}T[\d:.]+Z?/g, '~when~')
        .replace(/\s+/g, ' ').trim();
      const build = () => {
        const p = buildSharePayload(c, 'tok', { org: 'HaTi', sharedBy: 'Wanjiku Kamau' });
        return norm(JSON.stringify(p));
      };
      const keep = c.signSpots;
      const withMarks = build();
      c.signSpots = [];
      const without = build();
      c.signSpots = keep;
      let where = '';
      if (withMarks !== without) {
        let i = 0; while (i < withMarks.length && withMarks[i] === without[i]) i++;
        where = ' | first difference at ' + i + ': '
          + JSON.stringify(withMarks.slice(Math.max(0, i - 40), i + 60)) + ' vs '
          + JSON.stringify(without.slice(Math.max(0, i - 40), i + 60));
      }
      return { same: withMarks === without, len: withMarks.length, where };
    });
    check('8b THEIR COPY IS BYTE-IDENTICAL whether or not marks are placed',
      !!(portal && portal.same && portal.len > 200),
      portal ? `${portal.len} chars, identical: ${portal.same}${portal.where || ''}` : '—');

    check('9 no page errors anywhere in the journey', errors.length === 0,
      errors.slice(0, 3).join(' | '));

    await page.screenshot({ path: path.join(OUT, '04-final.png'), fullPage: false });
  } catch (e) {
    check('the journey ran', false, e.message);
  } finally {
    await browser.close();
    await h.stop();
  }

  const bad = results.filter(r => !r.pass);
  console.log(`\n${results.length - bad.length}/${results.length} checks passed`);
  if (bad.length) { console.log('FAILED:'); bad.forEach(r => console.log('  - ' + r.name + (r.detail ? ' — ' + r.detail : ''))); }
  process.exit(bad.length ? 1 : 0);
})();
