/* ============================================================
   THE PROOF THE PLAN WORKED — ONE CONTRACT, UPLOAD TO SHARE, ON HOME
   (the one-page Home plan, stage 6, 14 Oct 2026; docs/PLAN-one-page-home.md:
   "one contract from upload → fill in → redline → edit → sign → share,
   without leaving Home once — the demo's own walk, in the real app")
   ============================================================
   The owner, 13 Oct 2026: "My point I will never have to click off the board
   page to go elsewhere." Every step is taken by the door a person takes:
     1  "upload" in Jambo's box opens the upload; a real Word file is filed,
        and it lands on Home's paper with Fill in open beside it
     2  every owed box is typed in the Fill in face, until nothing is owed
     3  "redline" opens the redlines beside the paper
     4  "Edit a clause" opens the clause editor over Home; Save files the
        change through the one funnel, Exit lands back on the face with the
        row on it, and the row's own Discard takes it back
     5  "sign" opens Before you sign beside the paper, the signing copy on it;
        the Sign button, the pad, and the signature is on the server's record
     6  Share on the paper's line opens the one send screen, prefilled, over
        Home — nothing is sent (the press is always a person's)
   And over the whole walk, frame by frame: the view never leaves Home, the
   contract room is never drawn, and the Negotiate page's own paper is never
   drawn (the phone keeps its own screens; this is the owner's 1440×780).
   STAGED, AND SAID: the check before signing (Platform settings) waits on
   Jambo's brief, which the server writes and this run has no model for, so
   the walk's company has it switched off — the setting's own value, saved as
   an admin saves it; and the signers are named on the record, as
   sign-beside-the-paper-verify names them. Every press is real.
   AT THE PARENT (stage 5's head, 3d0ab0c) 18 of 19 hold — that is the plan
   working; only 5c fails there (the chips still offered "redline" on a
   signed contract), which is stage 6's own change. This file is the plan's
   standing proof: a later change that sends any one of these doors off Home
   turns it red.
   ============================================================ */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');
const { mkDocx, para } = require('../docxfix');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'one-page-home-walk');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const pause = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (name, ok, detail) => { ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const waitFor = async (page, fn, ms = 8000, arg) => { const end = Date.now() + ms;
  while (Date.now() < end) { if (await page.evaluate(fn, arg).catch(() => false)) return true; await pause(100); } return false; };

/* every frame, what stood in the window: the view, and whether the room or
   the Negotiate page's own paper was drawn */
const WATCH = () => { window._walk = {}; const tick = () => {
  const k = String(state.view) + (document.getElementById('ws-tabs') ? '+room' : '') + (document.getElementById('rl-doc') ? '+negpage' : '');
  window._walk[k] = (window._walk[k] || 0) + 1; requestAnimationFrame(tick); };
  requestAnimationFrame(tick); };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedWorkspace(h, { contracts: [], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e.message || e).slice(0, 200)));
  const settle = () => page.waitForFunction(() => !(window.intel && intel.busy), null, { timeout: 8000 }).catch(() => {});
  const say = async word => {
    await page.click('#igd-input'); await page.fill('#igd-input', '');
    await page.type('#igd-input', word, { delay: 15 }); await page.keyboard.press('Enter'); await settle();
  };
  const shot = name => page.screenshot({ path: path.join(OUT, name + '.png') }).catch(() => {});
  let id = null;
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(() => window.state && Array.isArray(state.contracts) && window.currentUser && currentUser(), null, { timeout: 15000 });
    await pause(800);
    await page.keyboard.press('Escape').catch(() => {});
    const en = await page.$('.lang-btn[data-lang="en"]'); if (en) await en.click();
    await page.evaluate(() => { setView('dashboard'); if (typeof hbSetFace === 'function') hbSetFace('paper'); });
    const wall = await waitFor(page, () => state.view === 'dashboard' && !!document.getElementById('igd-input'), 8000);
    check('0 Home\'s Document, Jambo\'s box ready, no contract yet', wall && await page.evaluate(() => state.contracts.length === 0));
    /* STAGED, AND SAID (see the head): the check before signing off */
    await page.evaluate(async () => { state.settings = state.settings || {}; state.settings.signCheckGate = 'off'; await saveSettings(); });
    await page.evaluate(WATCH);

    /* ===== 1. UPLOAD ===== */
    const file = path.join(OUT, 'Courier_Services_Agreement.docx');
    fs.writeFileSync(file, Buffer.from(mkDocx([
      para('COURIER SERVICES AGREEMENT'),
      para('This Agreement is made between Parcelway ApS and the Client.'),
      para('1. Services. The Supplier shall collect and deliver the Client\'s parcels within Nairobi.'),
      para('2. Fees. The Client shall pay each invoice within thirty (30) days of receipt.'),
      para('3. Term. This Agreement runs for twelve (12) months from signature.'),
    ].join(''))));
    /* RE-POINTED (the overnight work order, step 4, 15 Oct 2026): "upload"
       opens the file picker, not the pop-up; the file goes through the upload's
       own path and lands on the paper, and what the pop-up asked (the other
       party) is asked by Fill in below */
    /* RE-POINTED 18 Oct 2026 (LAND ON IT): "upload" lands on the drop area,
       lit, Choose a file ready, and presses nothing; Choose is the reader's */
    await say('upload');
    const lit1 = await waitFor(page, () => { const d = document.getElementById('pd-drop'); return !!d && d.classList.contains('is-landed'); }, 6000);
    const chooser = page.waitForEvent('filechooser', { timeout: 6000 }).catch(() => null);
    await page.click('#pd-drop [data-pd-drop-pick]').catch(() => {});
    const fc = await chooser;
    check('1a "upload" in Jambo\'s box lands on the drop area, lit; Choose a file opens the picker, no pop-up', !!lit1 && !!fc && await page.evaluate(() => state.view === 'dashboard' && !document.getElementById('up-file')));
    if (fc) await fc.setFiles(file);
    const landed = await waitFor(page, () => state.contracts.length === 1 && !!intel.paper && intel.paper.id === state.contracts[0].id
      && !!document.querySelector('#pd-og[data-pd-og-for="' + state.contracts[0].id + '"]'), 15000);
    id = await page.evaluate(() => (state.contracts[0] || {}).id || null);
    /* RE-POINTED 20 Oct 2026 (the Legora way): it lands on the Dossier, Still owed's grid asking what is owed */
    check('1b the file is filed and lands on Home\'s paper, Still owed\'s grid beside it', landed && await page.evaluate(() => state.view === 'dashboard' && hbFace() === 'paper'), id);
    await shot('1-uploaded');

    /* ===== 2. FILL IN ===== */
    const left0 = id ? await page.evaluate(i => detailsOf(getContract(i)).left, id) : 0;
    for (let i = 0; i < 16 && id; i++) {
      const next = await page.evaluate(() => { const b = [...document.querySelectorAll('#pd-og tr.pd-og-row:not(.is-saved) [data-blankf], #pd-og tr.pd-og-row:not(.is-saved) [data-kt]:not([type="checkbox"])')]
        /* a date wears HaTi's own picker (datePickDress), its real box behind it */
        .find(x => (x.offsetParent || x.type === 'date') && !x.disabled && !String(x.value || '').trim() && x.tagName !== 'SELECT');
        return b ? (b.getAttribute('data-kt') ? '[data-kt="' + b.getAttribute('data-kt') + '"]' : '[data-blankf="' + b.getAttribute('data-blankf') + '"]') : null; });
      if (!next || !(await page.evaluate(x => detailsOf(getContract(x)).left, id))) break;
      const sel = '#pd-og ' + next;
      const type = await page.$eval(sel, el => el.type).catch(() => '');
      if (type === 'date') await page.$eval(sel, el => { el.value = '2026-11-02'; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); });
      else { await page.click(sel); await page.keyboard.type(/value/.test(next) ? '240000' : /counterparty/.test(next) ? 'Parcelway ApS' : 'Nairobi', { delay: 5 }); }
      /* each row is Confirmed, as drawn */
      await page.evaluate(x => { const b = document.querySelector(x); const r = b && b.closest('tr'); const ok = r && r.querySelector('[data-pd-og-ok]'); if (ok) ok.click(); }, sel);
      await pause(300);
    }
    const filled = id ? await waitFor(page, i => !detailsOf(getContract(i)).left, 5000, id) : false;
    check('2 every owed box is filled in beside the paper, nothing owed after', left0 > 0 && filled && await page.evaluate(() => state.view === 'dashboard'),
      JSON.stringify({ before: left0, open: id && await page.evaluate(i => detailsOf(getContract(i)).items.filter(x => x.open).map(x => x.key), id),
        boxes: await page.evaluate(() => [...document.querySelectorAll('#pd-og [data-kt], #pd-og [data-blankf]')].map(b => (b.getAttribute('data-kt') || b.getAttribute('data-blankf')) + ':' + b.tagName + ':' + (b.type || '') + ':' + String(b.value || '').slice(0, 12) + (b.offsetParent ? '' : ':hidden'))) }));
    await shot('2-filled-in');

    /* ===== 3. REDLINE ===== */
    await say('redline');
    /* the fields question (negoBlanksAsk) is asked only while a blank is open */
    await page.evaluate(() => { const b = [...document.querySelectorAll('#confirm-overlay button')].find(x => /anyway/i.test(x.textContent)); if (b) b.click(); });
    const red = id ? await waitFor(page, i => !!document.getElementById('pd-redface') && typeof pdRedFor === 'function' && pdRedFor() === i, 8000, id) : false;
    check('3 "redline" opens the redlines beside the paper, on Home', red && await page.evaluate(() => state.view === 'dashboard' && hbFace() === 'paper'));
    await shot('3-redlines');

    /* ===== 4. EDIT ===== */
    /* PRESSED BY SELECTOR, NOT BY A HANDLE (15 Oct 2026): the face repaints
       as it settles, and a handle taken before the repaint points at nothing
       ("Element is not attached to the DOM" on one GitHub run). page.click
       finds the door afresh and waits for it, bounded; a missing door reports. */
    await page.click('#pd-redface [data-rl-edit-first="editor"], #pd-redface [data-rl-edit-clause="editor"]', { timeout: 8000 }).catch(() => {});
    const editor = await waitFor(page, () => { const b = document.getElementById('ce-clausebody'); return !!document.getElementById('clause-editor') && !!b && b.getAttribute('contenteditable') === 'true'; }, 8000);
    check('4a "Edit a clause" opens the clause editor over Home', editor && await page.evaluate(() => state.view === 'dashboard'));
    if (editor) {
      await page.evaluate(() => { const b = document.getElementById('ce-clausebody'); const w = document.createTreeWalker(b, NodeFilter.SHOW_TEXT); let n;
        while ((n = w.nextNode())){ const i = n.textContent.indexOf('thirty'); if (i >= 0){ const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 6);
          const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.focus(); return; } }
        const r = document.createRange(); r.selectNodeContents(b); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.focus(); });
      await page.keyboard.type('forty-five', { delay: 10 });
      await pause(300);
      await page.click('[data-ce-act="save"]').catch(() => {});
      await waitFor(page, i => (getContract(i).changes || []).some(x => x.authorSide === 'owner'), 8000, id);
      await pause(600);
      /* the filing's own ask for a note (owner-ruled 31 Aug 2026), skipped */
      await page.evaluate(() => { const k = [...document.querySelectorAll('#context-panel button')].find(x => /^Skip$/.test(x.textContent.trim())); if (k) k.click(); });
      await pause(300);
      await page.evaluate(() => { const x = document.querySelector('#clause-editor [data-ce-act="close"]'); if (x) x.click(); });
      await waitFor(page, () => !document.getElementById('clause-editor'), 5000);
      await page.evaluate(() => { const ok = document.querySelector('#confirm-overlay #cf-ok'); if (ok) ok.click(); });
      await page.evaluate(() => { const x = document.getElementById('panel-close'); if (x && document.querySelector('#context-panel.open')) x.click(); });
    }
    const chg = id ? await page.evaluate(i => { const c = getContract(i); const ch = (c.changes || []).find(x => x.authorSide === 'owner' && !x.withdrawn);
      return ch ? { id: ch.id, row: !!document.querySelector('#pd-redface [data-nego-card="' + ch.id + '"]') } : null; }, id) : null;
    await waitFor(page, x => !!x && !!document.querySelector('#pd-redface [data-nego-card="' + x + '"]'), 5000, chg && chg.id);
    const rowUp = chg ? await page.evaluate(x => !!document.querySelector('#pd-redface [data-nego-card="' + x + '"]'), chg.id) : false;
    check('4b Save files the change through the one funnel; Exit lands back on the face with its row', !!chg && rowUp
      && await page.evaluate(() => state.view === 'dashboard' && !!document.getElementById('pd-redface') && !document.getElementById('clause-editor')), JSON.stringify(chg));
    await shot('4-edited');
    /* the row's own last word takes it back, so the table is clear to sign */
    if (chg) {
      await page.evaluate(x => { const b = document.querySelector('#pd-redface [data-nego-card="' + x + '"] [data-rl-retract]'); if (b) b.click(); }, chg.id);
      await pause(400);
      await page.evaluate(() => { const ok = document.querySelector('#confirm-overlay #cf-ok'); if (ok) ok.click(); });
    }
    const clear = chg ? await waitFor(page, i => { const c = getContract(i); return !(c.changes || []).some(x => x.authorSide === 'owner' && !x.withdrawn && x.status !== 'withdrawn'); }, 6000, id) : false;
    check('4c the row\'s Discard takes it back, on the face', clear && await page.evaluate(() => state.view === 'dashboard' && !!document.getElementById('pd-redface')));

    /* ===== 5. SIGN ===== */
    await say('sign');
    const face = id ? await waitFor(page, i => !!document.querySelector('#pd-signface .pd-sf[data-pd-sf="' + i + '"]') && !!document.querySelector('#ig-paper .pg-sheet.pg-sign'), 10000, id) : false;
    check('5a "sign" opens Before you sign beside the paper, the signing copy on it', face && await page.evaluate(() => state.view === 'dashboard' && hbFace() === 'paper'));
    if (face) {
      /* STAGED, AND SAID (see the head): the signers named on the record */
      await page.evaluate(async i => {
        const c = getContract(i); await ensureFull(c); const me = currentUser();
        c.signerPlan = [{ id: 'sg_me', party: 'internal', name: me.name, memberId: me.id, email: me.email, order: 1, signed: false },
          { id: 'sg_cp', party: 'counterparty', name: 'Mette Lund', email: 'mette@parcelway.dk', order: 2, signed: false }];
        persist(c); await flushSaves(); renderSignButton(c);
      }, id);
    }
    /* pressable, and nothing on the one list before a signature holds it */
    const ready = face ? await waitFor(page, i => { const b = document.getElementById('sign-btn');
      return !!b && !b.disabled && b.getAttribute('aria-disabled') !== 'true' && signBlockers(getContract(i)).length === 0; }, 8000, id) : false;
    let stored = 0;
    if (ready) {
      await page.click('#sign-btn');
      const pad = await waitFor(page, () => !!document.getElementById('sig-intent'), 6000);
      if (pad) {
        await page.click('[data-sig-tab="type"]').catch(() => {}); await page.fill('#sig-typed', 'Amina Otieno').catch(() => {});
        await page.click('#sig-intent').catch(() => {}); await page.click('#sig-adopt-go').catch(() => {});
        await waitFor(page, () => !document.getElementById('sig-intent'), 6000);
      }
      for (let i = 0; i < 40 && !stored; i++) { const rec = await W.admin.json('/api/contracts/' + id); stored = (rec.signatures || []).length; if (!stored) await pause(150); }
    }
    check('5b the Sign button, the pad, and the signature is on the server\'s record — still on Home', ready && stored >= 1
      && await page.evaluate(i => state.view === 'dashboard' && !!document.querySelector('#pd-signface .pd-sf[data-pd-sf="' + i + '"]'), id),
      JSON.stringify({ ready, stored, btn: await page.evaluate(() => ((document.getElementById('sign-btn') || {}).textContent || '').replace(/\s+/g, ' ').trim()),
        holds: await page.evaluate(i => { try { const c = getContract(i); return { block: signBlockers(c).map(b => b.key + ':' + String(b.short || b.label || '').slice(0, 60)),
          ready: (signReadiness(c).holds || []).map(x => (x.key || x.k || '') + ':' + String(x.label || x.short || x.what || '').slice(0, 60)) }; } catch (e) { return String(e); } }, id) }));
    await shot('5-signed');
    /* a signature freezes the wording (negoWordingFrozen), so the redlines' door
       is shut, and the chip that opens it steps aside (stage 6) */
    /* at once, on the face still open — not only when the panel is drawn again */
    if (stored) await waitFor(page, () => !document.querySelector('[data-ig-chips] [data-ca-chip="redline"]'), 4000);
    const chips5 = await page.evaluate(() => [...document.querySelectorAll('[data-ig-chips] [data-ca-chip]')].map(b => b.getAttribute('data-ca-chip')));
    /* RE-POINTED AT THE INTEGRATION (19 Oct 2026): rounds 8 and 10 as drawn
       (lanes C1 and C2) draw NO chips under Fill in or Before you sign — the
       face carries its own acts (pdChipsQuiet). So at once, with the face
       still open, nothing offers "redline"; and back on Jambo's own words
       (the face's ‹ Jambo) obligations has taken its place. */
    const faceOpen = await page.evaluate(() => !!document.getElementById('pd-signface'));
    if (stored) await page.click('#ig-dock [data-pd-back="signing"]').catch(() => {});
    const back5 = stored ? await waitFor(page, () => !document.getElementById('pd-signface') && document.querySelectorAll('[data-ig-chips] [data-ca-chip]').length > 0, 6000) : false;
    const chips5b = await page.evaluate(() => [...document.querySelectorAll('[data-ig-chips] [data-ca-chip]')].map(b => b.getAttribute('data-ca-chip')));
    const nextMax = await page.evaluate(() => window.CA_NEXT_MAX);
    check('5c once signed, at once, nothing offers "redline" (no chips under the face, as drawn); back on Jambo, obligations takes its place',
      /* as many as CA_NEXT_MAX (four since round 3 as drawn, lane B2: "answer the redlines · name a signer · share · history") */
      stored >= 1 && faceOpen && !chips5.includes('redline') && back5 && typeof nextMax === 'number' && chips5b.length === nextMax && !chips5b.includes('redline') && chips5b.includes('oblig'), JSON.stringify({ underFace: chips5, faceOpen, back: chips5b, nextMax }));
    await shot('5c-chips-after-signing');

    /* ===== 6. SHARE ===== */
    const shareBtn = await page.click('#ig-strip #ws-share', { timeout: 8000 }).then(() => true, () => false);
    const send = await waitFor(page, () => !!document.querySelector('#modal-root .share-modal, #modal-root [data-share-purpose], #modal-root #sh-send, #modal-root #share-send'), 6000);
    const sendAt = await page.evaluate(() => ({ view: state.view, face: hbFace(), title: ((document.querySelector('#modal-root h2, #modal-root h3, #modal-root .dlg-h') || {}).textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80) }));
    check('6 Share on the paper\'s line opens the one send screen over Home; nothing is sent', !!shareBtn && send && sendAt.view === 'dashboard' && sendAt.face === 'paper', JSON.stringify(sendAt));
    await shot('6-share');
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(() => { if (typeof closeModal === 'function') closeModal(); });

    /* ===== THE CHIPS IN SVENSKA, ON THE OWNER'S THREE SCREENS =====
       the plan's Swedish names the deal board as the Board does
       ("förhandlingstavla"), a long word: every chip stays on its line, inside
       Jambo's panel, at 1440×780, 1536×730 and 1366×950 */
    if (id) await page.evaluate(i => { if (typeof langSet === 'function') langSet('sv'); pdOpenOnHome(i, 'copilot'); }, id);
    /* RE-POINTED 18 Oct 2026 (the gaps of rounds 8–11 as drawn): under a face
       the panel draws no chips; the face still up from the signing above goes
       back to Jambo first, by its own ‹ Jambo */
    for (let i = 0; i < 3 && await page.$('#ig-dock [data-pd-back]'); i++){ await page.click('#ig-dock [data-pd-back]').catch(() => {}); await pause(300); }
    for (const [w, hh] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: hh });
      await pause(500);
      await waitFor(page, () => !!document.querySelector('[data-ig-chips] [data-ca-chip]'), 5000);
      const fit = await page.evaluate(() => { const row = document.querySelector('[data-ig-chips]'); const dock = document.getElementById('ig-dock') || row;
        const d = dock.getBoundingClientRect();
        const chips = [...document.querySelectorAll('[data-ig-chips] [data-ca-chip]')].map(b => { const r = b.getBoundingClientRect(); const lh = parseFloat(getComputedStyle(b).lineHeight) || 20;
          return { t: b.textContent.trim(), inside: r.left >= d.left - 1 && r.right <= d.right + 1, oneLine: r.height <= lh * 1.6 + 12 }; });
        return { chips, sideways: document.documentElement.scrollWidth - window.innerWidth }; });
      check(`8 ${w}×${hh} Svenska: every chip on one line, inside Jambo's panel, nothing pushes the page sideways`,
        fit.chips.length > 0 && fit.chips.every(c => c.inside && c.oneLine) && fit.sideways <= 0, JSON.stringify(fit));
      await shot(`8-svenska-${w}x${hh}`);
    }
    await page.evaluate(() => { if (typeof langSet === 'function') langSet('en'); });
    await page.setViewportSize({ width: 1440, height: 780 });

    /* ===== THE WHOLE WALK ===== */
    const frames = await page.evaluate(() => Object.keys(window._walk || {}));
    check('7a frame by frame, the view never left Home', frames.length > 0 && frames.every(k => /^dashboard/.test(k)), JSON.stringify(frames));
    check('7b the contract room was never drawn', !frames.some(k => /\+room/.test(k)), JSON.stringify(frames));
    check('7c the Negotiate page\'s own paper was never drawn', !frames.some(k => /\+negpage/.test(k)), JSON.stringify(frames));
    check('7d no page errors on the way', errors.length === 0, errors.slice(0, 3).join(' | ') || 'none');
  } catch (e) {
    check('the walk completed', false, e.message);
  } finally {
    await browser.close();
    await h.stop();
  }
  console.log(`\n${pass}/${pass + fail} checks passed`);
  process.exit(fail ? 1 : 0);
})();
