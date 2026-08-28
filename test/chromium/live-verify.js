/* Chromium verification against the REAL server and the REAL index.html.
   ============================================================
   THIS FILE EXISTS BECAUSE THE OTHER HARNESS PASSED WHILE PRODUCTION WAS BROKEN.

   parity.html copies index.html's styles into a stage and then mounts the
   owner's screen first. Production does neither: it serves index.html itself,
   and on a share link the counterparty's page is the FIRST thing that renders.
   Stylesheets are injected as screens mount, so the two orders differ — and a
   CSS rule that ties on specificity is settled by exactly that order.

   The counterparty's reading buttons tied with .ui-btn at one class each. In
   the harness the portal's sheet landed last and won; in production it landed
   first and lost, so the buttons rendered surface-white with --color-text on
   them. Three rounds of "still white" against a fix that was live, because
   every check I had was answering a different question from the one the
   browser asks.

   So this boots the actual server, creates an actual share through the actual
   API, opens the actual URL, and reads getComputedStyle. No stage, no copied
   markup, no stubbed globals. Anything asserted here is asserted about the
   thing that ships.

   Run: node test/chromium/live-verify.js */
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, nameASigner } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (require('node:fs').existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

/* The reading verb's dress, written as the computed values a browser reports,
   because that is the only form of this claim that cannot be satisfied by a
   rule that loses.

   REVERSED IN PLACE 23 Aug 2026, owner-asked ("the highlighted buttons in
   image 2 should not be shaded inside and should resemble the ready to sign
   button"). This used to demand the accent TINT — .ui-btn's filled face — and
   the fault it was guarding against was a button rendering SURFACE-WHITE and
   so vanishing into the header it sits in. That fault has not gone away and is
   still pinned; what changed is which dress counts as the fix. The fill came
   off, so the ink and the accent OUTLINE are now the whole of what says
   "button", and the claim is asked as those two rather than as the fill.

   THE FLAT FACE IS NOT A GREY ONE, and that half is asserted too: this product
   has learned three separate times that a neutral-grey control reads as
   furniture. */
const INK = 'rgb(17, 94, 89)';
const SURFACE_WHITE = 'rgb(255, 255, 255)';
const TRANSPARENT = 'rgba(0, 0, 0, 0)';
const GREY = /rgb\(2[0-9]\d, 2[0-9]\d, 2[0-9]\d\)/;

function contract(){
  return { id: 'MK-LIVE', name: 'Mutual Non-Disclosure Agreement — Juno Limited',
    counterparty: 'Juno Limited', template: 'WH', status: 'Under Review', folder: 'proc',
    format: 'text', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [],
    redlineText: '1. Purpose\n\nThe Parties wish to explore a relationship.\n\n3. Term\n\nTwo (2) years.',
    changes: [{ id: 'CHG-001', clauseId: 'cl-1', clauseLabel: 'Clause 1 · Purpose',
      changeType: 'modify', status: 'pending', summary: 'Purpose narrowed',
      oldText: 'The Parties wish to explore a relationship.',
      newText: 'The Parties may explore a relationship.',
      ops: [{ op: 'del', text: 'wish to' }, { op: 'ins', text: 'may' }],
      author: 'Young Mbagaya', authorSide: 'owner', createdAt: new Date().toISOString() }] };
}

const READ = () => {
  const out = {};
  for (const id of ['pt-hist', 'pt-compare']){
    const el = document.getElementById(id);
    if (!el){ out[id] = null; continue; }
    const cs = getComputedStyle(el);
    out[id] = { bg: cs.backgroundColor, color: cs.color, icon: !!el.querySelector('svg'),
      bd: cs.borderTopColor, bw: cs.borderTopWidth };
  }
  return out;
};

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h);
  const c = contract();
  await W.admin.json('/api/contracts/MK-LIVE', { method: 'PUT', body: { contract: c, baseVersion: 0 } });
  /* A Sign link cannot be issued until somebody is named to sign (11 Aug 2026).
     This file walks the counterparty's SCREEN on both kinds of link, so the
     route is the precondition rather than the subject. */
  await nameASigner(W.admin, 'MK-LIVE', { name: 'Juno Limited', email: 'juno@example.co.ke' });
  const mk = async purpose => {
    const r = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: { kind: 'hati-share', purpose, org: 'Young', sharedBy: 'Young Mbagaya', contract: c },
      recipient: { name: 'Juno Limited', email: 'juno@example.co.ke' }, channel: 'link', purpose } });
    return r.token || (r.link || '').split('share=')[1];
  };

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];

  for (const purpose of ['negotiate', 'sign']){
    const token = await mk(purpose);
    /* A fresh context each time: no storage, no cache carried between runs —
       the state a counterparty opening a link for the first time is in. */
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(`${purpose}: ${e.message}`));
    await page.goto(`${h.base}/#share=t:${token}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(900);

    const m = await page.evaluate(READ);
    const seen = m['pt-hist'] || m['pt-compare'];
    check(`${purpose}: the reading buttons are on the page`, !!seen,
      seen ? '' : 'neither #pt-hist nor #pt-compare rendered');
    if (seen){
      for (const [id, v] of Object.entries(m)){
        if (!v) continue;
        check(`${purpose}: #${id} is not shaded inside`,
          v.bg === TRANSPARENT, v.bg);
        check(`${purpose}: #${id} still reads as a button — an accent outline, never grey`,
          parseFloat(v.bw) > 0 && v.bd !== SURFACE_WHITE && !GREY.test(v.bd),
          `${v.bw} ${v.bd}${v.bd === SURFACE_WHITE ? ' — this is the bug it always guarded' : ''}`);
        check(`${purpose}: #${id} carries the accent ink`, v.color === INK, v.color);
        check(`${purpose}: #${id} has a shape to aim at`, v.icon, v.icon ? 'svg' : 'no icon');
      }
    }

    /* ---------- "REVIEW WHAT CHANGED" OPENS THE RECORD ----------
       (owner-asked, 12 Aug 2026.) It used to unhide a read-only mount of the
       negotiation workbench inside the signing page — the round queue, the
       marked document and the Tracked Changes column, under the wording the
       reader was about to sign, with a strip of dead deal verbs at the foot of
       it. It opens the Negotiation history now.

       ASSERTED IN A BROWSER because both halves are claims about pixels, and
       jsdom can make neither. A dialog that renders behind the page, or at zero
       height, passes every node assertion ever written about it — which is the
       lesson f180 and derive-dialog-verify were both written for. And the
       absence of the workbench is measured on the real page rather than on a
       hidden node with a class on it: nothing is deleted by display:none. */
    if (purpose === 'sign'){
      const before = await page.evaluate(() => ({
        door: !!document.getElementById('pt-nego-open'),
        mount: !!document.getElementById('pt-nego'),
        foot: !!document.getElementById('pt-nego-foot'),
        dialog: !!document.getElementById('history-timeline'),
      }));
      check('sign: the door is drawn, and no workbench under it',
        before.door && !before.mount && !before.foot && !before.dialog,
        `door=${before.door} mount=${before.mount} foot=${before.foot}`);

      await page.evaluate(() => document.getElementById('pt-nego-open').click());
      await page.waitForTimeout(500);
      const after = await page.evaluate(() => {
        const el = document.getElementById('history-timeline');
        if (!el) return { there: false };
        const r = el.getBoundingClientRect();
        const hit = document.elementFromPoint(
          Math.min(window.innerWidth - 2, Math.max(2, r.left + r.width / 2)),
          Math.min(window.innerHeight - 2, Math.max(2, r.top + 12)));
        return { there: true, w: Math.round(r.width), h: Math.round(r.height),
          onTop: !!(hit && (el === hit || el.contains(hit))),
          mount: !!document.getElementById('pt-nego'),
          text: (el.textContent || '').replace(/\s+/g, ' ').slice(0, 120) };
      });
      check('sign: pressing it puts the Negotiation history on screen',
        after.there && after.w > 300 && after.h > 100, `${after.w}x${after.h}`);
      check('sign: and it paints OVER the page, not behind it', after.onTop);
      check('sign: and still no read-only workbench is mounted', !after.mount);
      await page.screenshot({ path: path.join(__dirname, 'shots', 'sign-history.png') })
        .catch(() => {});
    }
    await ctx.close();
  }

  /* ---------- THE SHADED EDIT BOX KEEPS ITS WIDTH ----------
     Asked for by name, because it has been broken before and cost rounds to
     find. A textarea does not shrink to fit: dropped into a container without
     box-sizing and a width it can push that container wider, and the clause
     the reader is editing changes shape under them.

     Measured, not reasoned about — the clause block before the editor opens
     and after, and again with a long unbroken string in the reason field,
     which is the input that actually widens a box. */
  {
    const token = await mk('negotiate');
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 950 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(`editor: ${e.message}`));
    await page.goto(`${h.base}/#share=t:${token}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(900);

    /* RE-POINTED 16 Aug 2026: the clause's Direct Edit retired with the tool
       row (no edits on the paper — all writing through the panel), so the
       press is the Edit pill and then the panel's ＋ — and the box whose
       width must hold still is the PANEL body the editor opens in, not the
       clause behind it. Same claim, its new home. */
    const pillPressed = await page.evaluate(() => {
      /* .rl-cp-pill, not any [data-rl-cp-open]: the CARD's Open button was given
         the same attribute on 16 Aug 2026, so a bare selector now matches the
         column as well as the paper and "the last one" is a card rather than a
         clause. The pill is the paper's own door and is what this walk means. */
      const pill = document.querySelector('.rl-clause .rl-cp-pill');
      if (!pill) return false; pill.click();
      return !!document.querySelector('.rl-cp-src.is-on');
    });
    await page.waitForTimeout(400);
    const before = await page.evaluate(() => {
      const b = document.querySelector('.rl-cp-src.is-on');
      return b ? Math.round(b.getBoundingClientRect().width) : null;
    });
    const opened = pillPressed && await page.evaluate(() => {
      const plus = document.querySelector('.rl-cp-src.is-on [data-rl-cp-edit]');
      if (!plus) return false; plus.click();
      return true;
    });
    check('editor: the pill and the ＋ open an editor in the panel', !!opened);
    await page.waitForTimeout(500);

    /* ---- SAVE IS ONE PRESS ----
       REVERSED IN PLACE 28 Aug 2026 (owner-asked: "we need to remove the
       mandate for adding why this change for every change"). What stood here
       walked the two steps and pinned the reason box's width, wrapping and
       box-sizing.

       THE GEOMETRY CLAIMS ARE KEPT AND RE-POINTED AT THE EDITOR, which is
       where they always mattered more: a long unbroken string typed into a
       panel's editor must wrap rather than widen the block or push the page
       sideways. That was the defect class those checks were written for, and
       the editor is a box a person really does paste a reference number into.
       Only the claims about the reason FIELD go, with the field. */
    const s1 = await page.evaluate(() => ({
      next: !!document.querySelector('[data-nego-next]'),
      noReason: !document.querySelector('[data-nego-reason]'),
      noSkip: !document.querySelector('[data-nego-skip]'),
      noBack: !document.querySelector('[data-nego-back]'),
      blockW: (() => { const b = document.querySelector('.rl-cp-src.is-on');
        return b ? Math.round(b.getBoundingClientRect().width) : null; })(),
    }));
    check('editor: SAVE FILES — no reason box, no Skip, no way back from a step',
      s1.next && s1.noReason && s1.noSkip && s1.noBack, JSON.stringify(s1));
    check('editor: the box has not moved with the editor open', s1.blockW === before,
      `${before}px → ${s1.blockW}px`);

    const m = await page.evaluate(() => {
      const ed = document.querySelector('[data-nego-editor]');
      const blk = ed && ed.closest('.rl-cp-src');
      if (!ed || !blk) return null;
      const cs = getComputedStyle(ed);
      return { blockW: Math.round(blk.getBoundingClientRect().width),
        edW: Math.round(ed.getBoundingClientRect().width),
        boxSizing: cs.boxSizing, overflowWrap: cs.overflowWrap };
    });
    check('editor: the editor is there', !!m);
    if (m){
      check('editor: the panel body keeps its width', m.blockW === before,
        `${before}px before, ${m.blockW}px with the editor open`);
      check('editor: it is sized from the box, not from its own content',
        m.boxSizing === 'border-box', m.boxSizing);
      check('editor: text wraps rather than running sideways',
        m.overflowWrap === 'anywhere' || m.overflowWrap === 'break-word', m.overflowWrap);

      const stressed = await page.evaluate(() => {
        const ed = document.querySelector('[data-nego-editor]');
        ed.innerHTML = '<p>Our AP cycle runs monthly and the committee approves runs on the last '
          + 'Thursday, so Net-30 forces an out-of-cycle payment. '
          + 'REF-SUPPLIERAGREEMENTSCHEDULEB-PAYMENTTERMS-2026-REVISION-FOURTEEN-NO-SPACES</p>';
        const blk = ed.closest('.rl-cp-src');
        return { blockW: Math.round(blk.getBoundingClientRect().width),
          sideways: ed.scrollWidth > ed.clientWidth + 1,
          pageOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth };
      });
      check('editor: a long unbroken reference does not widen the box',
        stressed.blockW === before, `${stressed.blockW}px`);
      check('editor: and it wraps instead of scrolling sideways', !stressed.sideways);
      check('editor: the page still does not scroll sideways', !stressed.pageOverflow);
    }
    /* ---- AND NO CARD PRINTS A REASON ----
       The two-step save shipped asking for a reason that then appeared
       nowhere: it was written onto two card renderers and not the third — the
       one in the change column that people actually read — and every test in
       the suite passed because they checked that the FIELD existed rather than
       that the answer arrived.

       REVERSED IN PLACE 28 Aug 2026: the step is gone, so nothing typed here
       can be walked to a card. What is still checkable, and is the half this
       page can honestly answer, is that no card on this seat prints or clamps
       one — the removal of 19 Aug is pinned rather than assumed. A reason that
       EXISTS is proved to reach the PANEL in clause-door-verify, on a stage
       whose payload carries durable clause ids (see the note below).

       The stress test above left a long unbroken string in the editor. Put real
       wording back and file it: a save that files no wording change files
       nothing to look for. */
    await page.evaluate(() => {
      const ed = document.querySelector('[data-nego-editor]');
      ed.innerHTML = '<p>The Parties may explore a relationship.</p>';
      document.querySelector('[data-nego-next]').click();
    });
    await page.waitForTimeout(900);
    /* A reason stamped straight onto the filed change, because nothing on this
       path types one any more: the claim is about the CARD RENDERER, and a card
       that would print a reason it holds is what must not exist. */
    await page.evaluate(r => {
      const cs = (window.PORTAL_CONTRACT && window.PORTAL_CONTRACT.changes)
        || (window.CONTRACT && window.CONTRACT.changes) || [];
      if (cs.length) cs[cs.length - 1].why = r;
      const host = document.querySelector('.redline-page');
      if (host && window.rlRepaintFrom) rlRepaintFrom(host);
    }, 'LIVE-REASON our AP cycle runs monthly and our finance committee only approves payment runs on the last Thursday.');
    await page.waitForTimeout(600);
    const edited = await page.evaluate(() => [...document.querySelectorAll('[data-nego-card]')]
      .map(e => e.textContent).join(''));
    /* WHERE THE REASON LIVES NOW. These checks read the CARD until 19 Aug 2026,
       when the owner asked for the reason to come off it — a refused ask whose
       whole reason was the word "No" was spending a line of a card that already
       carries eight. whyBlock in redlineChangeCardsHtml is a stub and the fact
       moved to the clause panel's row for that change, on the clause the reason
       is about, one press of Open away.

       THE CLAIM IS UNCHANGED AND IS WHAT MATTERED ALL ALONG: the words the
       author typed have to REACH A READER, not merely be stored. That was the
       original defect — a reason written to two renderers and not the third — so
       the walk still goes all the way from the box to the pixels, it just ends
       one press further on. The card is read too and must NOT carry it, so the
       removal is pinned rather than assumed. */
    check('reason: it is off the change card, where it was asked to be',
      !edited.includes('LIVE-REASON'),
      edited.includes('LIVE-REASON') ? 'the card is still printing the reason' : '');

    /* AND WHERE IT WENT IS PINNED SOMEWHERE ELSE, said out loud rather than
       left as a gap. The obvious next check — press Open, read the reason off
       the clause panel — cannot be answered HERE, and the reason is this
       file's own fixture rather than the product: it hand-builds its share
       payload (see mk() above) with no `negotiation` block at all, so no
       baselineBody travels. The counterparty's page therefore has no durable
       clause ids to read and mints its own on every rebuild — measured, the
       paper's ids differ between one repaint and the next — so a change filed
       a second ago already names a clause that no longer exists, and the panel
       has nothing to show for it. buildSharePayload does carry baselineBody;
       this fixture simply never asked it to.

       So the claim lives on a stage that can hold it: clause-door-verify files
       a change through the panel's own editor with a reason and reads that
       reason back off the painted panel. What is asserted here is the half
       this page can honestly answer — the reason is off the card, and no card
       clamps one, because none carries one. */

    /* ---- THE TWO-LINE CLAMP MOVED WITH THE REASON ----
       This measured a clamped block on the change card: it genuinely overflowed
       its two lines, Show more appeared because of that measurement, and
       pressing it unfolded. All true, and none of it on this screen any more —
       the reason left the card on 19 Aug 2026 and the panel above deliberately
       shows it WHOLE, which the check above now pins.

       THE CLAMP ITSELF IS NOT RETIRED and this is not a claim being dropped: it
       is still drawn by negoLiveCardsHtml, wired by negoWireWhyClamp, on the
       CONTRACT TAB's cards and in the closed-round history — screens this file
       does not render, because it drives the counterparty's share link. Its home
       is that renderer's own harness, not this one. What is asserted here is the
       half this page can actually answer: nothing on this seat clamps a reason
       any more, because no card on this seat carries one. */
    const strayClamp = await page.evaluate(() =>
      document.querySelectorAll('[data-nego-card] .nego-why-clamp').length);
    check('reason: no card on this seat clamps a reason, because none carries one',
      strayClamp === 0, strayClamp ? `${strayClamp} clamped blocks still on cards` : '');

    /* No deletion checks: the Propose deletion buttons were removed on both
       seats (Young, 03 Aug 2026). What must now be true is the opposite — no
       clause offers one. Deletion CHANGES remain first-class in the engine. */
    const delBtns = await page.evaluate(() => document.querySelectorAll('[data-nego-del]').length);
    check('deletion: no clause offers Propose deletion any more', delBtns === 0,
      delBtns ? `${delBtns} delete buttons still render` : '');
    await ctx.close();
  }

  /* ---------- FORMATTING-ONLY EDITS FILE (the work order that began on this
     page). Bold a clause, change no words, walk the two-step save — the change
     must FILE, wear the formatting-only chip, and carry a truthful summary.
     Then the refusal that remains: save with nothing changed at all, and the
     answer must land IN the edit bar, not only in a corner toast. A RICH
     contract, because a plain-text one has no formatting to promise. */
  {
    /* Clause ids are STAMPED, as buildSharePayload's negotiation.baselineBody
       always carries them — a payload without them re-mints ids on every
       portal repaint and the filed change loses its clause (which is the
       fixture bug this comment prevents from coming back, not a product one). */
    const RICH_BODY = '<h1>Distribution Agreement</h1>'
      + '<h2 data-clause-id="cl_purp01">1. Purpose</h2><p>The Distributor wholesales wines; the Client purchases for resale.</p>'
      + '<h2 data-clause-id="cl_term02">2. Term</h2><p>Two (2) years from the effective date.</p>';
    const rich = { id: 'MK-LIVE-R', name: 'Distribution Agreement — Juno Limited',
      counterparty: 'Juno Limited', template: 'WH', status: 'Under Review', folder: 'proc',
      format: 'rich', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
      signatures: [], comments: [], changes: [],
      redlineText: RICH_BODY,
      negotiation: { round: 1, turn: 'counterparty', turnAt: null,
        baselineBody: RICH_BODY, baselineText: '', chainHead: null, chainSeq: 0, seq: 0, rounds: [] } };
    await W.admin.json('/api/contracts/MK-LIVE-R', { method: 'PUT', body: { contract: rich, baseVersion: 0 } });
    const r = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: { kind: 'hati-share', purpose: 'negotiate', org: 'Young', sharedBy: 'Young Mbagaya', contract: rich },
      recipient: { name: 'Juno Limited', email: 'juno@example.co.ke' }, channel: 'link', purpose: 'negotiate' } });
    const token = r.token || (r.link || '').split('share=')[1];
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 950 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(`fmt: ${e.message}`));
    await page.goto(`${h.base}/#share=t:${token}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(900);

    const opened = await page.evaluate(() => {
      /* The pill and the ＋, since 16 Aug 2026 — the clause's own Direct Edit
         retired with the tool row on this seat too. */
      /* .rl-cp-pill, not any [data-rl-cp-open]: the CARD's Open button was given
         the same attribute on 16 Aug 2026, so a bare selector now matches the
         column as well as the paper and "the last one" is a card rather than a
         clause. The pill is the paper's own door and is what this walk means. */
      const pill = document.querySelector('.rl-clause .rl-cp-pill');
      if (!pill) return false; pill.click();
      const plus = document.querySelector('.rl-cp-src.is-on [data-rl-cp-edit]');
      if (!plus) return false; plus.click();
      return true;
    });
    check('fmt: the editor opens on the counterparty page', opened);
    await page.waitForTimeout(400);
    await page.evaluate(() => {
      const ed = document.querySelector('[data-nego-editor]');
      // the B button's own result: same words, bold markup
      ed.innerHTML = ed.innerHTML.replace(/<p>/g, '<p><b>').replace(/<\/p>/g, '</b></p>');
      document.querySelector('[data-nego-next]').click();
    });
    await page.waitForTimeout(900);
    const filed = await page.evaluate(() => ({
      cards: [...document.querySelectorAll('[data-nego-card]')].map(e => e.textContent).join(''),
      chip: !!document.querySelector('.nego-note.fmt'),
      fmtBody: !!document.querySelector('.nego-fmt-only'),
    }));
    check('fmt: the formatting-only change FILED — a card is on the index',
      /CHG-\d+/.test(filed.cards) && /Draft/.test(filed.cards), filed.cards ? filed.cards.slice(0, 60) : 'no card rendered');
    check('fmt: the clause wears the formatting-only chip', filed.chip);
    check('fmt: the document shows the proposed markup, not an unmarked baseline', filed.fmtBody);

    /* And the true no-op: open the OTHER clause, change nothing, file. */
    const noop = await page.evaluate(async () => {
      /* .rl-cp-pill, not any [data-rl-cp-open]: the CARD's Open button was given
         the same attribute on 16 Aug 2026, so a bare selector now matches the
         column as well as the paper and "the last one" is a card rather than a
         clause. The pill is the paper's own door and is what this walk means. */
      const pills = [...document.querySelectorAll('.rl-clause .rl-cp-pill')];
      const pill = pills[pills.length - 1];
      if (!pill) return null; pill.click();
      await new Promise(r => setTimeout(r, 250));
      const b = document.querySelector('.rl-cp-src.is-on [data-rl-cp-edit]');
      if (!b) return null; b.click();
      await new Promise(r => setTimeout(r, 300));
      document.querySelector('[data-nego-next]')?.click();
      await new Promise(r => setTimeout(r, 600));
      const n = document.querySelector('.nego-edit-bar .nego-nofile');
      return n ? n.textContent : null;
    });
    check('fmt: a save with nothing changed says so IN the bar, beside the button',
      !!noop && /Nothing changed/.test(noop), noop || 'no inline message rendered');
    await ctx.close();
  }

  await browser.close();
  await h.stop();
  errors.slice(0, 5).forEach(e => check('no page error', false, e));

  const bad = results.filter(r => !r.pass).length;
  console.log(`\n${results.length - bad}/${results.length} checks passed`);
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
