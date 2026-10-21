/* Chromium verification: WHAT THIS CONTRACT NEEDS FROM YOU — the side panel's
   checklist (Young picked "Checklist" by name, 27 Sep 2026, off the "Attention
   Banner Options" page: "Implement checklist.").
   ====================================================================
   f395 pins what the code SAYS. This file measures what a reader SEES and
   DOES on the real app: the checklist sits under the name block and above the
   status line, counts what is owed, colours each row by its urgency and the
   frame by the worst row, keeps every row to one line, and each button opens
   the exact place its item is answered. Nothing owed draws nothing.

   THE STAGE is a new workspace with the sample portfolio and four contracts
   put into states through the product's own acts:
     MK-149 Carrefour — three of their asks, nine days old, on a negotiation
            this reader leads (deskOpen, the deliberate claim), and a
            colleague's review of two of them asked of this reader;
     MK-158 PwC       — this reader first on the signing route, the fields
            filled and the value rule approved, so three checks stand;
     MK-143 Sendy     — owned by this reader, ending in 64 days with 30 days'
            notice, so the renewal decision falls in 34;
     MK-131 Kabras    — nothing owed: the [control].

   Every claim is GATED on the thing it measures being on the page, so a
   build without the feature REPORTS its failures rather than timing out.
   AT THE PARENT (c8a049d), measured in a worktree: 21 of 25 FAIL — there is
   no checklist to find. The four that pass are the stage, the two [control]s
   (6a nothing owed draws nothing, 6b the head is its old five rows there) and
   the page-error sweep. Three claims first passed there VACUOUSLY (the panel
   not growing sideways, the unowned renewal, the Approvals page leaving the
   signature out — each true of a panel with no checklist) and are gated on
   the row they speak about having been drawn.

   SECTION 8 (Young, 27 Sep 2026: "Yes, make them go straight to the right
   place") presses Home's "Needs your decision" rows and the bell's renewal and
   request-to-join rows and compares each landing with the one the checklist's
   own button reached earlier in this run. To reach every kind it puts
   Carrefour on the shelf, opens a desk on Kabras with a join request, puts the
   Sendy renewal away from Prepared for you and moves its dates — all through
   the product's own acts. AT THE PARENT (ba092e2), measured in a worktree:
   all 8 of section 8 FAIL, each landing on the contract's Document tab with
   no sheet — the defect the owner saw — and nothing else moves.

   Run: node test/chromium/inspector-checklist-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'inspector-checklist');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForSelector('#su-org', { timeout: 15000 });
    await page.fill('#su-org', 'Highland Corporate Ltd'); await page.fill('#su-name', 'Young Mbagaya');
    await page.fill('#su-email', 'admin@example.co.ke'); await page.fill('#su-pass', 'adminpassword1');
    const sample = await page.$('#su-sample'); if (sample && !(await sample.isChecked())) await sample.check();
    await page.click('#su-go'); await page.waitForTimeout(3500); await page.keyboard.press('Escape').catch(() => {});
    /* RE-POINTED 20 Oct 2026 (Chambers): the bar carries no language switch; langSet is the one writer */
    await page.evaluate(() => { if (typeof langSet === 'function') langSet('en'); }); await page.waitForTimeout(400);

    /* ---- the stage ---- */
    const staged = await page.evaluate(async () => {
      const me = currentUser();
      /* approvals joined this checklist (owner's rule 6, 8 Oct 2026) and the
         sample book's spend rule asks the admin on most contracts; this
         stage is about the other kinds, so the rule is set aside for it */
      state.settings = state.settings || {}; state.settings.approvalRules = [];
      const day = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
      const w = getContract('MK-149'), s = getContract('MK-158'), r = getContract('MK-143');
      if (!w || !s || !r) return null;
      /* NOTHING LEFT TO FILL IN (12 Oct 2026): the Details tab's own count
         joined the checklist; this stage is about the other kinds, so each
         sample contract is answered first, through the record. */
      [w, s, r].forEach(k => { const d = window.detailsOf ? detailsOf(k) : { items: [] };
        d.items.filter(x => x.open).forEach(x => {
          if (x.key === 'counterparty') k.counterparty = k.counterparty || 'Counterparty Ltd';
          else if (x.key === 'value') k.value = 1000000;
          else if (x.key === 'effDate') { k.fields = k.fields || {}; k.fields.effDate = day(-30); }
          else if (x.kind === 'tplf') { k.templateForm.values = k.templateForm.values || {}; k.templateForm.values[x.key] = 'x'; }
          else { k.fields = k.fields || {}; k.fields[x.key] = 'x'; } }); });
      w.changes = []; delete w.negotiation; negoInit(w);
      const cls = negoClauseList(w).filter(x => x && x.clauseId && x.clauseId !== 'front');
      const byName = re => cls.find(x => re.test((typeof clauseLabel === 'function' ? clauseLabel(x) : '') + ' ' + (x.headingText || '')));
      const asks = [
        [/Trading Terms/, b => b.replace('5% volume rebate', '7.5% volume rebate')],
        [/Payment/, b => b.replace(/within 60 days/, 'within 90 days')],
        [/Limitation of Liability/, b => b.replace(/<\/p>(?![\s\S]*<\/p>)/, ' The cap shall not apply to product recalls.</p>')],
      ];
      for (const [re, edit] of asks) {
        const cl = byName(re); if (!cl) continue;
        const now = negoClauseNowById(w, cl.clauseId);
        const body = (now && now.bodyHtml) || '<p>' + ((now && now.text) || '') + '</p>';
        await negoEditClause(w, cl.clauseId, edit(body), { side: 'counterparty', author: 'Carrefour Kenya' });
        const last = w.changes[w.changes.length - 1];
        if (last) last.createdAt = new Date(Date.now() - 9 * 864e5).toISOString();
      }
      w.owner = { id: me.id, name: me.name };
      if (typeof deskOpen === 'function') deskOpen(w, { lead: me, by: me });
      if (typeof reviewAsk === 'function')
        reviewAsk(w, { reviewer: { id: me.id, name: me.name, email: me.email }, by: 'Amina Otieno', ids: w.changes.slice(0, 2).map(x => x.id), due: day(5) });
      s.signerPlan = [
        { id: 'sg_ym', party: 'internal', name: me.name, role: 'Managing Director', email: me.email, memberId: me.id, order: 1, signed: false, at: null, by: null, signature: null },
        { id: 'sg_pw', party: 'counterparty', name: 'Grace Wanjiru', role: 'Partner, PwC Kenya', email: 'grace.wanjiru@pwc.example', memberId: '', order: 2, signed: false, at: null, by: null, signature: null },
      ];
      s.owner = { id: me.id, name: me.name };
      const fill = { 'Start date': day(4), 'Services': 'Statutory audit of the FY2026 financial statements', 'Billing': 'Quarterly, in arrears' };
      try { (contractBlanksOpen(s) || []).forEach(b => contractBlankSet(s, b.key, fill[b.label] || day(4))); } catch (_) {}
      try { approveContract(s); } catch (_) {}
      r.owner = { id: me.id, name: me.name };
      r.expiry = day(64);
      r.metadata = Object.assign({}, r.metadata || {}, { expiryDate: day(64), noticePeriodDays: 30 });
      return { asks: w.changes.length, desk: !!(typeof deskIsOpen === 'function' && deskIsOpen(w)),
        review: !!(w.review && w.review.requests && w.review.requests.length), signN: (signReadiness(s) || {}).n,
        renewal: (renewalWindow(r) || {}).days };
    });
    ok('the stage: their three asks on a negotiation we lead, a review asked of us, our signature, a renewal due',
      !!staged && staged.asks === 3 && staged.desk && staged.review && staged.signN === 3 && staged.renewal === 34, JSON.stringify(staged));

    /* RE-POINTED AT STEP 7 OF THE OVERNIGHT WORK ORDER (15 Oct 2026): the
       Contracts page is Home's Contracts place, its List drawn with no side
       panel (the owner's drawing), so the checklist is read where the panel
       still stands for these contracts — the Negotiations page (MK-149), the
       one builder (insNeedsHtml). What only the Contracts panel drew — the
       signature row on MK-158, the renewal row on MK-143, the nothing-owed
       control on MK-131 (2a–2c, 6a–6b) — retired with it; it is named to the
       owner as a decision (where a contract that stands only on Contracts
       shows what it needs from you). The doors those rows' buttons pressed are
       the checklist's one door, needsYouGo, and 3c–3d press it. */
    const toContracts = async () => { await page.evaluate(() => openNegotiations({ list: true })); await page.waitForTimeout(1000); };
    const pick = async id => {
      const row = await page.$(`#reg-tbody tr[data-row="${id}"]`);
      if (!row) return false;
      await row.click(); await page.waitForTimeout(450);
      return page.evaluate(i => (document.getElementById('ins-panel') || { getAttribute: () => null }).getAttribute('data-ins-id') === i, id);
    };
    /* RE-POINTED 18 Oct 2026 (Jambo's panel, round 14 "Whose move" as drawn —
       the owner's "build all the gaps" covers moving the 27 Sep checklist): what
       is owed is the panel's own "Needs you" SECTION after the facts — a quiet
       card, a dot in each row's tone, the title on one line and its line under
       it on at most two, the row's own verb — no longer a coloured band under
       the name. The same reading (needsYouOf, insNeedWords) and the same door
       (needsYouGo). */
    const read = () => page.evaluate(() => {
      const p = document.getElementById('ins-panel');
      const sec = p && p.querySelector('.jl-needs');
      const n = sec && sec.querySelector('.jl-need');
      const hd = p && p.querySelector('.ins-h');
      const body = p && (p.querySelector('.jl-body') || p);
      const lh = el => { const cs = getComputedStyle(el); return parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.5; };
      return {
        head: hd ? [...hd.children].map(x => x.className.split(' ')[0]) : [],
        order: body ? [...body.children].map(x => x.className.split(' ').filter(k => /^(ins-h|ins-facts|jl-needs|ins-reads|jl-rows|ins-lead)$/.test(k))[0] || x.className.split(' ')[0]) : [],
        drawn: !!n, frame: n ? n.className : null,
        name: sec ? (sec.querySelector('h3') || { innerText: '' }).innerText.trim() : null,
        count: n ? n.querySelectorAll('.jl-need-r').length : null,
        rows: n ? [...n.querySelectorAll('.jl-need-r')].map(r => ({ kind: r.getAttribute('data-ins-need-row') || r.getAttribute('data-jl-need-row'), tone: /is-ruby/.test(r.className) ? 'ruby' : (/is-amber/.test(r.className) ? 'amber' : ''),
          title: r.querySelector('.jl-need-t').innerText.trim(), sub: (r.querySelector('.jl-need-s') || { innerText: '' }).innerText.trim(),
          hover: (r.querySelector('.jl-need-s') || { title: '' }).title,
          oneLine: (() => { const t = r.querySelector('.jl-need-t'), u = r.querySelector('.jl-need-s');
            return t.getBoundingClientRect().height <= lh(t) * 1.4 && (!u || u.getBoundingClientRect().height <= lh(u) * 2.4); })(),
          verb: (r.querySelector('[data-ins-need]') || r.querySelector('[data-jl-need]')).innerText.trim() })) : [],
        /* RE-POINTED 9 Oct 2026 (SAP benchmark): the list's panel no longer
           draws the asks table, so its number is asked of the same reading the
           table drew from (insTable), oldest ask first. */
        table: (() => { const id = p && p.getAttribute('data-ins-id'); const t = id && window.insTable ? insTable(getContract(id)) : null;
          const th = t ? t.items.filter(x => x.who === 'theirs' && x.days != null).map(x => x.days) : [];
          return th.length ? `from them · ${Math.max(...th)} days` : ''; })(),
        over: p ? p.scrollWidth - p.clientWidth : 0,
      };
    });

    /* ================= 1 · THE LIST'S PANEL (NEGOTIATIONS): WHERE IT SITS AND WHAT IT SAYS ================= */
    await toContracts();
    const on149 = await pick('MK-149');
    const a = on149 ? await read() : { head: [], rows: [] };
    /* RE-POINTED 9 Oct 2026 (SAP benchmark, owner-approved): the stage sits
       beside the name, so the head has no status row of its own. */
    ok('1a the head is the reference and the agreement, the party and the doors; Needs you is its own section after the facts, before what Jambo read',
      a.drawn && a.head.join(' > ') === 'ins-eb > ins-cp > ins-acts' && a.order.join(' > ') === 'ins-h > ins-facts > jl-needs > ins-reads', a.head.join(' > ') + ' · ' + a.order.join(' > '));
    ok('1b the section is named "Needs you" and holds a row for each thing owed', a.drawn && a.name === 'Needs you' && a.count === 2, `${a.name} · ${a.count}`);
    ok('1c the late item leads and is ruby; the card itself stays quiet (the dot carries the tone)',
      a.drawn && a.rows.map(r => r.kind + ':' + r.tone).join(',') === 'quiet:ruby,review:amber' && !/is-ruby|is-amber/.test(a.frame || ''),
      a.rows.map(r => r.kind + ':' + r.tone).join(',') + ' · ' + a.frame);
    const quiet = (a.rows || []).find(r => r.kind === 'quiet');
    const oldest = (a.table.match(/from [^·\n]+· (\d+) days?/) || [])[1];
    ok('1d their waiting redlines are named and counted, and the days are the asks table\'s own number',
      !!quiet && /Answer Carrefour Kenya.s 3 redlines/.test(quiet.title) && oldest && new RegExp('Waiting ' + oldest + ' days?').test(quiet.sub),
      quiet ? `${quiet.title} / ${quiet.sub} · table says ${oldest}` : 'no row');
    ok('1e the standard is on the hover, so the line stays one line', !!quiet && /5-working-day standard/.test(quiet.hover) && !/standard/.test(quiet.sub),
      quiet ? `line "${quiet.sub}" · hover "${quiet.hover}"` : 'no row');
    const rev = (a.rows || []).find(r => r.kind === 'review');
    ok('1f the review names who asked, how many, and by when', !!rev && /Review 2 changes for Amina Otieno/.test(rev.title) && /^Due /.test(rev.sub),
      rev ? `${rev.title} / ${rev.sub}` : 'no row');
    ok('1g every row\'s title is one line, its line under it at most two, with its own verb', a.drawn && a.rows.every(r => r.oneLine && r.verb) && a.rows.map(r => r.verb).join(',') === 'Answer,Review',
      a.rows.map(r => `${r.kind}:${r.oneLine ? 'fits' : 'WRAPS'}:${r.verb}`).join(' · '));
    ok('1h the panel does not grow sideways', a.drawn && a.over <= 1, `${a.over}px${a.drawn ? '' : ' (no checklist drawn)'}`);
    const edge = await page.evaluate(() => {
      const b = document.querySelector('#ins-panel .jl-need-r.is-ruby [data-ins-need]');
      if (!b) return null;
      const tok = (prop, v) => { const e = document.createElement('i'); e.style.cssText = 'position:absolute;' + prop + ':var(' + v + ')'; document.body.appendChild(e); const c = getComputedStyle(e)[prop === 'color' ? 'color' : 'borderTopColor']; e.remove(); return c; };
      const cs = getComputedStyle(b);
      return { edge: cs.borderTopColor, btnEdge: tok('border-top:1px solid;border-top-color', '--btn-edge'), ink: cs.color, accent: tok('color', '--accent-ink'), h: b.getBoundingClientRect().height, sm: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ctl-h-sm')) };
    });
    /* RE-POINTED 9 Oct 2026 (SAP benchmark, owner-approved): the callout's door
       is a white button in the accent's ink, as the drawing draws "Decide". */
    ok('1i a row\'s button wears the platform\'s one light edge, the accent ink on its word, and the row rung\'s height',
      !!edge && edge.edge === edge.btnEdge && edge.ink === edge.accent && Math.abs(edge.h - edge.sm) <= 1, JSON.stringify(edge));
    await page.screenshot({ path: path.join(OUT, '1-contracts-carrefour.png') });

    /* ================= 2 · THE SIGNATURE AND THE RENEWAL =================
       RETIRED AT STEP 7: their rows were drawn only by the Contracts page's
       panel, which the Contracts place does not draw (see the note above).
       What the rows read (needsYouOf: the signature's holds, the owner's
       renewal by the notice deadline) stays pinned by f395. */
    const sign = await page.evaluate(() => (window.needsYouOf ? needsYouOf(getContract('MK-158')) : []).find(x => x.kind === 'sign') || null);

    /* ================= 3 · EVERY BUTTON OPENS WHERE ITS ITEM IS ANSWERED ================= */
    const press = async (id, kind) => {
      await toContracts();
      if (!(await pick(id))) return { missing: 'row' };
      const b = await page.$(`#ins-panel [data-ins-need="${kind}"]`);
      if (!b) return { missing: 'button' };
      await b.click(); await page.waitForTimeout(1200);
      return page.evaluate(() => ({ view: state.view, id: state.activeId,
        held: (typeof redlineHeldId === 'function') ? redlineHeldId() : null,
        face: (document.getElementById('pd-redface') && window.intel && intel.paper) ? intel.paper.id : null,
        /* stage 5: the review notice at the top of the Redlines face, and
           Jambo's Before you sign face (the Signing tab's twin on Home) */
        notices: ((document.querySelector('#pd-redface .pd-rf-notices') || {}).textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80),
        signFace: (document.querySelector('#pd-signface .pd-sf[data-pd-sf]') || { getAttribute: () => null }).getAttribute('data-pd-sf'),
        signSheet: !!document.querySelector('#ig-paper .pg-sheet.pg-sign #ig-canvas'),
        tab: (typeof roomCurrentTab === 'function') ? roomCurrentTab() : null,
        /* step 8: the contract's strip on the Board (its id and page) */
        strip: (() => { const t = document.querySelector('#bs-strips > .bs-strip'); return t ? t.getAttribute('data-bs-id') + ':' + t.getAttribute('data-bs-on') : null; })(),
        renewal: !!document.querySelector('#bs-strips [data-bs-host="details"] #renewal-host'),
        room: !!document.getElementById('ws-tabs'),
        sheet: !!document.getElementById('dk-close') }));
    };
    const g1 = await press('MK-149', 'quiet');
    /* RE-POINTED 14 Oct 2026 (the one-page Home plan, stage 3; owner's yes:
       every door from outside opens the Redlines face): their waiting
       redlines are answered beside Home's paper, in Jambo's panel. */
    ok('3a Answer opens the negotiation on that contract', g1.view === 'dashboard' && g1.face === 'MK-149', JSON.stringify(g1));
    const g2 = await press('MK-149', 'review');
    /* a REVIEW stays on the Negotiate page (stage 3): handing it back is the page's review notice */
    /* RE-POINTED 14 Oct 2026 (the one-page Home plan, stage 5): the
       Negotiate page folded into Home, and its notices stand at the top of
       Jambo's Redlines face (.pd-rf-notices) — so a review's door opens the
       face too, where the review is handed back now */
    ok('3b Review opens the negotiation too — where the review is handed back', g2.view === 'dashboard' && g2.face === 'MK-149' && !!g2.notices, JSON.stringify(g2));
    /* the checklist's one door, as the retired Contracts row's button pressed it */
    const door = async (id, kind) => { await page.evaluate(() => { try { closeModal(); } catch (_) {} openWorkspace('MK-150'); }); await page.waitForTimeout(700);
      await page.evaluate(a => needsYouGo(a.kind, a.id), { id, kind }); await page.waitForTimeout(1200);
      return page.evaluate(() => ({ view: state.view, id: state.activeId,
        held: (typeof redlineHeldId === 'function') ? redlineHeldId() : null,
        signFace: (document.querySelector('#pd-signface .pd-sf[data-pd-sf]') || { getAttribute: () => null }).getAttribute('data-pd-sf'),
        signSheet: !!document.querySelector('#ig-paper .pg-sheet.pg-sign #ig-canvas'),
        tab: (typeof roomCurrentTab === 'function') ? roomCurrentTab() : null,
        strip: (() => { const t = document.querySelector('#bs-strips > .bs-strip'); return t ? t.getAttribute('data-bs-id') + ':' + t.getAttribute('data-bs-on') : null; })(),
        renewal: !!document.querySelector('#bs-strips [data-bs-host="details"] #renewal-host'),
        room: !!document.getElementById('ws-tabs'),
        sheet: !!document.getElementById('dk-close') })); };
    const g3 = await door('MK-158', 'sign');
    /* RE-POINTED 14 Oct 2026 (stage 5): the Signing tab went home — Sign
       opens Jambo's Before you sign face on that contract, beside Home's
       paper drawn as the signing copy */
    ok('3c Sign (the checklist\'s one door) opens that contract on its Signing tab', !!sign && g3.view === 'dashboard' && g3.signFace === 'MK-158' && g3.signSheet, JSON.stringify(g3));
    const g4 = await door('MK-143', 'renewal');
    /* RE-POINTED 15 Oct 2026 (step 8, the room retired): the Overview's
       sheet, renewal card and all, is the contract strip's Details page on
       Home's Board — Decide opens it there, the room not drawn */
    ok('3d Decide (the checklist\'s one door) opens that contract on its Overview, where the renewal card records the decision', g4.view === 'dashboard' && g4.id === 'MK-143' && g4.strip === 'MK-143:details' && g4.renewal && !g4.room, JSON.stringify(g4));

    /* ================= 4 · A COLLEAGUE ASKING TO JOIN — A THIRD ROW, AND ITS DOOR ================= */
    await page.evaluate(() => { const d = deskOf(getContract('MK-149')); d.joinRequests = (d.joinRequests || []).concat([{ id: 'u-peter', name: 'Peter Kamau', email: 'peter@example.co.ke',
      at: new Date(Date.now() - 2 * 864e5).toISOString(), why: 'I handle the Carrefour account', status: 'pending' }]); });
    await toContracts();
    const j = (await pick('MK-149')) ? await read() : { rows: [] };
    ok('4a a join request is a third row, after the two older kinds, with the reason in their own words',
      j.drawn && j.count === 3 && j.rows.map(x => x.kind).join(',') === 'quiet,review,join'
      && /Peter Kamau wants to join this negotiation/.test(j.rows[2] && j.rows[2].title) && /I handle the Carrefour account/.test(j.rows[2] && j.rows[2].sub),
      j.rows ? j.rows.map(x => `${x.kind}: ${x.title} / ${x.sub}`).join(' · ') : 'none');
    await page.screenshot({ path: path.join(OUT, '4-three-things.png') });
    const g5 = await press('MK-149', 'join');
    /* RE-POINTED 15 Oct 2026 (step 8): the contract opens as its strip on the
       Board, the desk's sheet over it */
    ok('4b Answer on a join request opens the contract with the sheet where the lead lets them in', g5.view === 'dashboard' && g5.id === 'MK-149' && /^MK-149:/.test(g5.strip || '') && g5.sheet && !g5.room, JSON.stringify(g5));
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(() => { try { closeModal(); } catch (_) {} const d = deskOf(getContract('MK-149')); d.joinRequests = []; });

    /* ================= 5 · THE OTHER TWO PAGES THAT DRAW THE PANEL ================= */
    await page.evaluate(() => openNegotiations({ list: true })); await page.waitForTimeout(1200);
    const nrow = await page.$('#reg-tbody tr[data-row="MK-149"]');
    if (nrow) { await nrow.click(); await page.waitForTimeout(450); }
    const n = nrow ? await read() : { rows: [] };
    /* RE-POINTED AT STEP 7: section 1 reads this same page now, so 5a asks the
       one reading (needsYouOf) rather than the retired Contracts panel */
    const kinds149 = await page.evaluate(() => needsYouOf(getContract('MK-149')).map(x => x.kind).join(','));
    ok('5a the Negotiations page draws the checklist the one reading gives for the same contract', n.drawn && n.rows.map(x => x.kind).join(',') === 'quiet,review'
      && kinds149 === 'quiet,review' && n.rows[0] && quiet && n.rows[0].title === quiet.title, n.rows.map(x => x.kind + ': ' + x.title).join(' · ') + ' · reading ' + kinds149);
    await page.evaluate(() => { apSetTab('signatures'); setView('approvals'); }); await page.waitForTimeout(1000);
    const arow = await page.$('.ap-table tbody tr[data-ap-row="MK-158"]');
    if (arow) { await arow.click(); await page.waitForTimeout(450); }
    const ap = arow ? await page.evaluate(() => { const p = document.getElementById('ins-panel');
      /* RE-POINTED 18 Oct 2026 (round 15 as drawn): a signature's panel says what stands before it in its rows and its holds */
      return { id: p && p.getAttribute('data-ins-id'), need: !!(p && p.querySelector('.jl-needs')), sign: !!(p && p.querySelector('[data-ins-need-row="sign"]')),
        lead: !!(p && (p.querySelector('.ins-lead') || p.querySelector('.jl-rows [data-ins-fact="why"]'))) }; }) : null;
    ok('5b the Approvals & signing page\'s signing panel leaves the signature out — its own lead already says what stands before signing',
      /* GATED on the one reading owing the signature for this very contract
         (the Contracts panel that drew it went at step 7) — or "left out" is
         only "never owed". */
      !!sign && !!ap && ap.id === 'MK-158' && ap.lead && !ap.sign, JSON.stringify(ap));

    /* ================= 6 · NOTHING OWED DRAWS NOTHING =================
       RETIRED AT STEP 7 with the Contracts page's panel (MK-131 stands on no
       other list); the rule stays pinned by f395 and every other list's panel. */

    /* ================= 7 · ONE THEME, AND IT READS THE TOKENS =================
       RE-POINTED 20 Oct 2026 (the owner picked "Chambers" and removed dark
       mode): there is no night theme to switch to any more, so 7a asserts that
       (no setDark, no dark class) and measures the one theme instead — the late
       row's dot is the ruby token's own, the section's name reads at 4.5:1 or
       better. */
    await toContracts();
    const one = (await pick('MK-149')) ? await page.evaluate(() => {
      const n = document.querySelector('#ins-panel .jl-needs');
      if (!n) return null;
      const tok = v => { const e = document.createElement('i'); e.style.cssText = 'position:absolute;color:var(' + v + ')'; document.body.appendChild(e); const c = getComputedStyle(e).color; e.remove(); return c; };
      const dot = n.querySelector('.jl-need-r.is-ruby .jl-need-dot');
      const bgOf = el => { for (let x = el; x; x = x.parentElement){ const b = getComputedStyle(x).backgroundColor; if (b && !/rgba\(0, 0, 0, 0\)|transparent/.test(b)) return b; } return 'rgb(255, 255, 255)'; };
      const head = n.querySelector('h3');
      const lum = rgb => { const m = rgb.match(/\d+(\.\d+)?/g).map(Number).slice(0, 3).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]; };
      const ratio = (f, b) => { const a = lum(f), c = lum(b); return (Math.max(a, c) + 0.05) / (Math.min(a, c) + 0.05); };
      const hcs = getComputedStyle(head);
      const dotBg = dot ? getComputedStyle(dot).backgroundColor : null;
      return { setDark: typeof window.setDark, darkClass: document.documentElement.classList.contains('dark'), dot: dotBg, rubyDot: (() => { const e = document.createElement('i'); e.style.cssText = 'position:absolute;background:var(--st-ruby-dot)'; document.body.appendChild(e); const c = getComputedStyle(e).backgroundColor; e.remove(); return c; })(),
        headInk: hcs.color, headBg: bgOf(head), contrast: +ratio(hcs.color, bgOf(head)).toFixed(2), rubyFg: tok('--st-ruby-fg') };
    }) : null;
    ok('7a no night theme to switch to; the late row\'s dot takes the ruby token\'s own answer, and the section\'s name reads at 4.5:1 or better',
      !!one && one.setDark === 'undefined' && !one.darkClass && !!one.dot && one.dot === one.rubyDot && one.contrast >= 4.5, JSON.stringify(one));
    await page.screenshot({ path: path.join(OUT, '7-one-theme.png') });

    /* ================= 8 · HOME'S ROWS AND THE BELL'S ROWS GO WHERE THE BUTTONS WENT =================
       (Young, 27 Sep 2026: "Yes, make them go straight to the right place".)
       Every landing below is compared with the one the checklist's own button
       reached in section 3/4 — a RELATION, never a destination typed out twice.
       BEFORE EVERY PRESS the room is opened on another contract, because the
       room remembers its tab per contract: without that, a row that only
       opened the contract would land on Signing because section 3 left it
       there, and the claim would pass on the fault. */
    /* step 8: a landing names the contract's strip (id:page) too, so two
       doors agree only where they open the same strip on the same page */
    const landOf = g => g.view === 'redline' ? 'negotiate:' + g.held
      : g.view + ':' + g.id + ':' + g.tab + (g.sheet ? ':sheet' : '') + (g.strip ? ':strip=' + g.strip : '');
    const want = (g, id) => landOf(Object.assign({}, g, { id, held: id, strip: g.strip ? String(g.strip).replace(/^[^:]*/, id) : g.strip }));
    const elsewhere = async () => {
      await page.evaluate(() => { try { closeModal(); } catch (_) {} openWorkspace('MK-150', { room: true }); });
      await page.waitForTimeout(700);
    };
    const landing = () => page.evaluate(() => ({ view: state.view, id: state.activeId,
      held: (typeof redlineHeldId === 'function') ? redlineHeldId() : null,
      tab: (typeof roomCurrentTab === 'function') ? roomCurrentTab() : null,
      /* step 8: the contract's strip on the Board (its id and page) */
      strip: (() => { const t = document.querySelector('#bs-strips > .bs-strip'); return t ? t.getAttribute('data-bs-id') + ':' + t.getAttribute('data-bs-on') : null; })(),
      renewal: !!document.querySelector('#bs-strips [data-bs-host="details"] #renewal-host'),
      room: !!document.getElementById('ws-tabs'),
      sheet: !!document.getElementById('dk-close') }));
    /* RE-POINTED 28 Sep 2026 (Young: "lets add just this part to the home
       page and discard the current 2 cards"): Home's decisions card is gone,
       so 8a–8e no longer press a Home row. Each is replaced by the one claim
       that stands — Home draws no decisions row — at the same moment in the
       stage; the stage changes between them are kept, because the bell's
       checks (8f on) are staged on top of them. */
    const homeHasRows = async () => {
      await page.evaluate(() => setView('dashboard')); await page.waitForTimeout(900);
      return page.evaluate(() => document.querySelectorAll('#hm-dd-rows [data-sel]').length);
    };
    /* 8a–8b: as staged, the card's two rows are the Carrefour review and the
       Carrefour negotiation gone quiet (reviews lead, then quiet deals). */
    ok('8a Home draws no decisions row while a review and a quiet deal wait — the checklist is the door', (await homeHasRows()) === 0);

    /* 8c–8d: Carrefour put on the shelf (the card reads live contracts only),
       and a colleague asking to join a negotiation this reader leads on
       Kabras — so the card's two rows are the join request and our signature. */
    await page.evaluate(() => {
      const me = currentUser();
      getContract('MK-149').archived = { at: new Date().toISOString(), by: me.name };
      const k = getContract('MK-131');
      deskOpen(k, { lead: me, by: me });
      const d = deskOf(k);
      d.joinRequests = [{ id: 'u-peter', name: 'Peter Kamau', email: 'peter@example.co.ke',
        at: new Date(Date.now() - 2 * 864e5).toISOString(), why: 'I handle the Kabras account', status: 'pending' }];
    });
    ok('8c Home draws no row for a request to join or a signature either', (await homeHasRows()) === 0);

    /* 8e: the join request answered, so the card is our signature and the
       Sendy renewal — with the Sendy renewal put away from Prepared for you
       through the product's own act (deskDismiss), because a renewal the desk
       draws is taken off this card by the one-door rule (f274). */
    await page.evaluate(() => { deskOf(getContract('MK-131')).joinRequests = [];
      const r = getContract('MK-143'); deskDismiss(r, 'renewal'); deskDismiss(r, 'notice'); });
    ok('8e nor for a renewal decision', (await homeHasRows()) === 0);

    /* 8f–8h: THE BELL. Its renewal row rings inside thirty days, so the Sendy
       decision is brought to ten days out; the join request comes back. */
    const pressBell = async (kind, ref) => {
      await elsewhere();
      await page.click('#hdr-notify'); await page.waitForTimeout(700);
      const rows = await page.$$('#context-panel [data-alert-i]');
      let hit = null;
      for (const r of rows) {
        const k = await r.getAttribute('data-alert-kind');
        const t = (await r.innerText()).replace(/\s+/g, ' ');
        if (k === kind && t.includes(ref)) { hit = { el: r, text: t.trim().slice(0, 90) }; break; }
      }
      if (!hit) return { row: null, g: null };
      await hit.el.click(); await page.waitForTimeout(1300);
      return { row: hit.text, g: await landing() };
    };
    await page.evaluate(() => {
      const day = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
      const r = getContract('MK-143'); r.expiry = day(40); r.metadata = Object.assign({}, r.metadata, { expiryDate: day(40), noticePeriodDays: 30 });
      deskOf(getContract('MK-131')).joinRequests = [{ id: 'u-peter', name: 'Peter Kamau', email: 'peter@example.co.ke',
        at: new Date(Date.now() - 2 * 864e5).toISOString(), why: 'I handle the Kabras account', status: 'pending' }];
    });
    const b1 = await pressBell('renewal', 'MK-143');
    ok('8f the bell\'s renewal-decision row opens that contract on its Overview — where the checklist\'s Decide button went',
      !!b1.row && landOf(b1.g) === want(g4, 'MK-143'), b1.row ? `${b1.row} → ${landOf(b1.g)} · button went ${landOf(g4)}` : 'no bell row for MK-143');
    const b2 = await pressBell('desk-join', 'MK-131');
    ok('8g the bell\'s request-to-join row opens the contract with the sheet where the lead lets them in',
      !!b2.row && landOf(b2.g) === want(g5, 'MK-131'), b2.row ? `${b2.row} → ${landOf(b2.g)} · button went ${landOf(g5)}` : 'no bell row for MK-131');
    await page.keyboard.press('Escape').catch(() => {});
    /* The bell's OTHER renewal row: an agreement ending inside thirty days,
       past its notice deadline, so it is no longer a decision but still rings. */
    await page.evaluate(() => {
      const day = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
      const r = getContract('MK-143'); r.expiry = day(20); r.metadata = Object.assign({}, r.metadata, { expiryDate: day(20), noticePeriodDays: 30 });
      deskOf(getContract('MK-131')).joinRequests = [];
    });
    const b3 = await pressBell('renewal', 'MK-143');
    ok('8h the bell\'s "ends in N days" row goes to the same place — the Overview, where the renewal card is',
      !!b3.row && /20 days/.test(b3.row) && landOf(b3.g) === want(g4, 'MK-143'), b3.row ? `${b3.row} → ${landOf(b3.g)}` : 'no bell row for MK-143');
    await page.evaluate(() => { delete getContract('MK-149').archived; });

    ok('9 no page errors on the way', errs.length === 0, errs.join(' | '));
  } catch (e) {
    ok('the run finished', false, String(e && e.stack || e).slice(0, 400));
  } finally {
    await browser.close(); await h.stop();
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
  }
})();
