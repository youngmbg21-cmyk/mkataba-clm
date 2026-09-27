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
    const en = await page.$('.lang-btn[data-lang="en"]'); if (en) { await en.click(); await page.waitForTimeout(800); }

    /* ---- the stage ---- */
    const staged = await page.evaluate(async () => {
      const me = currentUser();
      const day = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
      const w = getContract('MK-149'), s = getContract('MK-158'), r = getContract('MK-143');
      if (!w || !s || !r) return null;
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

    const toContracts = async () => { await page.evaluate(() => { regSetScope(null); setView('register'); }); await page.waitForTimeout(1000); };
    const pick = async id => {
      const row = await page.$(`#reg-tbody tr[data-row="${id}"]`);
      if (!row) return false;
      await row.click(); await page.waitForTimeout(450);
      return page.evaluate(i => (document.getElementById('ins-panel') || { getAttribute: () => null }).getAttribute('data-ins-id') === i, id);
    };
    const read = () => page.evaluate(() => {
      const p = document.getElementById('ins-panel');
      const n = p && p.querySelector('.ins-need');
      const hd = p && p.querySelector('.ins-h');
      const lh = el => { const cs = getComputedStyle(el); return parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.5; };
      return {
        head: hd ? [...hd.children].map(x => x.className.split(' ')[0]) : [],
        drawn: !!n, frame: n ? n.className : null,
        count: n ? n.querySelector('.ins-need-h').innerText.trim() : null,
        rows: n ? [...n.querySelectorAll('.ins-need-r')].map(r => ({ kind: r.getAttribute('data-ins-need-row'), tone: /is-ruby/.test(r.className) ? 'ruby' : (/is-amber/.test(r.className) ? 'amber' : ''),
          title: r.querySelector('.ins-need-t').innerText.trim(), sub: (r.querySelector('.ins-need-s') || { innerText: '' }).innerText.trim(),
          hover: (r.querySelector('.ins-need-s') || { title: '' }).title,
          oneLine: [r.querySelector('.ins-need-t'), r.querySelector('.ins-need-s')].filter(Boolean).every(el => el.getBoundingClientRect().height <= lh(el) * 1.4),
          verb: r.querySelector('[data-ins-need]').innerText.trim() })) : [],
        table: (p && p.querySelector('.ins-table')) ? p.querySelector('.ins-table').innerText : '',
        over: p ? p.scrollWidth - p.clientWidth : 0,
      };
    });

    /* ================= 1 · THE CONTRACTS PAGE: WHERE IT SITS AND WHAT IT SAYS ================= */
    await toContracts();
    const on149 = await pick('MK-149');
    const a = on149 ? await read() : { head: [], rows: [] };
    ok('1a the checklist sits under the name block and above the status line — the party names and the agreement stay together',
      a.drawn && a.head.join(' > ') === 'ins-eb > ins-cp > ins-sub > ins-need > ins-st > ins-acts', a.head.join(' > '));
    ok('1b the head counts what is owed', a.drawn && /^2 things need you$/i.test(a.count || ''), a.count);
    ok('1c the late item leads and is ruby; the frame takes the worst row\'s colour',
      a.drawn && a.rows.map(r => r.kind + ':' + r.tone).join(',') === 'quiet:ruby,review:amber' && /is-ruby/.test(a.frame || ''),
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
    ok('1g every row is one line, with its own verb', a.drawn && a.rows.every(r => r.oneLine && r.verb) && a.rows.map(r => r.verb).join(',') === 'Answer,Review',
      a.rows.map(r => `${r.kind}:${r.oneLine ? 'one line' : 'WRAPS'}:${r.verb}`).join(' · '));
    ok('1h the panel does not grow sideways', a.drawn && a.over <= 1, `${a.over}px${a.drawn ? '' : ' (no checklist drawn)'}`);
    const edge = await page.evaluate(() => {
      const b = document.querySelector('#ins-panel .ins-need-r.is-ruby [data-ins-need]');
      if (!b) return null;
      const tok = (prop, v) => { const e = document.createElement('i'); e.style.cssText = 'position:absolute;' + prop + ':var(' + v + ')'; document.body.appendChild(e); const c = getComputedStyle(e)[prop === 'color' ? 'color' : 'borderTopColor']; e.remove(); return c; };
      const cs = getComputedStyle(b);
      return { edge: cs.borderTopColor, btnEdge: tok('border-top:1px solid;border-top-color', '--btn-edge'), ink: cs.color, ruby: tok('color', '--st-ruby-fg'), h: b.getBoundingClientRect().height, sm: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ctl-h-sm')) };
    });
    ok('1i a row\'s button wears the platform\'s one light edge, the row\'s colour on its word, and the row rung\'s height',
      !!edge && edge.edge === edge.btnEdge && edge.ink === edge.ruby && Math.abs(edge.h - edge.sm) <= 1, JSON.stringify(edge));
    await page.screenshot({ path: path.join(OUT, '1-contracts-carrefour.png') });

    /* ================= 2 · THE SIGNATURE AND THE RENEWAL ================= */
    const on158 = await pick('MK-158');
    const s = on158 ? await read() : { rows: [] };
    const sign = (s.rows || []).find(r => r.kind === 'sign');
    const signTruth = await page.evaluate(() => { const c = getContract('MK-158'); const rd = signReadiness(c); const r0 = (rd.holds || [])[0];
      return { n: rd.n, first: r0 ? signRowTitle(c, r0) : '' }; });
    ok('2a your signature counts what stands before it — the Signing tab\'s own number — and names the first thing in its own words',
      !!sign && sign.title === `Your signature — ${signTruth.n} things first` && sign.sub.indexOf(signTruth.first) === 0 && /and 2 more$/.test(sign.sub) && sign.tone === 'amber',
      sign ? `${sign.title} / ${sign.sub} · truth ${JSON.stringify(signTruth)}` : 'no row');
    const on143 = await pick('MK-143');
    const r = on143 ? await read() : { rows: [] };
    const ren = (r.rows || []).find(x => x.kind === 'renewal');
    ok('2b a renewal on a contract you own: decide by the notice deadline, and how far away', !!ren && ren.title === 'Renew or exit'
      && /^Decide by .+ · in 34 days$/.test(ren.sub) && ren.tone === 'amber' && ren.verb === 'Decide', ren ? `${ren.title} / ${ren.sub} / ${ren.tone}` : 'no row');
    await page.evaluate(() => { getContract('MK-143').owner = { id: 'someone-else', name: 'Grace Ndungu' }; });
    const again143 = (await pick('MK-131')) && (await pick('MK-143'));
    const r2 = again143 ? await read() : { drawn: true };
    /* GATED on 2b's row having been drawn for the owner: without it this passes on
       a build that draws nothing at all. */
    ok('2c a renewal on a contract somebody else owns is theirs to decide — no row, and nothing else owed means no checklist', !!ren && again143 && !r2.drawn,
      JSON.stringify({ drawn: r2.drawn, rows: (r2.rows || []).map(x => x.kind) }));
    await page.evaluate(() => { const me = currentUser(); getContract('MK-143').owner = { id: me.id, name: me.name }; });

    /* ================= 3 · EVERY BUTTON OPENS WHERE ITS ITEM IS ANSWERED ================= */
    const press = async (id, kind) => {
      await toContracts();
      if (!(await pick(id))) return { missing: 'row' };
      const b = await page.$(`#ins-panel [data-ins-need="${kind}"]`);
      if (!b) return { missing: 'button' };
      await b.click(); await page.waitForTimeout(1200);
      return page.evaluate(() => ({ view: state.view, id: state.activeId,
        held: (typeof redlineHeldId === 'function') ? redlineHeldId() : null,
        tab: (typeof roomCurrentTab === 'function') ? roomCurrentTab() : null,
        sheet: !!document.getElementById('dk-close') }));
    };
    const g1 = await press('MK-149', 'quiet');
    ok('3a Answer opens the negotiation on that contract', g1.view === 'redline' && g1.held === 'MK-149', JSON.stringify(g1));
    const g2 = await press('MK-149', 'review');
    ok('3b Review opens the negotiation too — where the review is handed back', g2.view === 'redline' && g2.held === 'MK-149', JSON.stringify(g2));
    const g3 = await press('MK-158', 'sign');
    ok('3c Sign opens that contract on its Signing tab', g3.view === 'workspace' && g3.id === 'MK-158' && g3.tab === 'sign', JSON.stringify(g3));
    const g4 = await press('MK-143', 'renewal');
    ok('3d Decide opens that contract on its Overview, where the renewal card records the decision', g4.view === 'workspace' && g4.id === 'MK-143' && g4.tab === 'terms', JSON.stringify(g4));

    /* ================= 4 · A COLLEAGUE ASKING TO JOIN — A THIRD ROW, AND ITS DOOR ================= */
    await page.evaluate(() => { const d = deskOf(getContract('MK-149')); d.joinRequests = (d.joinRequests || []).concat([{ id: 'u-peter', name: 'Peter Kamau', email: 'peter@example.co.ke',
      at: new Date(Date.now() - 2 * 864e5).toISOString(), why: 'I handle the Carrefour account', status: 'pending' }]); });
    await toContracts();
    const j = (await pick('MK-149')) ? await read() : { rows: [] };
    ok('4a a join request is a third row, after the two older kinds, with the reason in their own words',
      j.drawn && /^3 things need you$/i.test(j.count || '') && j.rows.map(x => x.kind).join(',') === 'quiet,review,join'
      && /Peter Kamau wants to join this negotiation/.test(j.rows[2] && j.rows[2].title) && /I handle the Carrefour account/.test(j.rows[2] && j.rows[2].sub),
      j.rows ? j.rows.map(x => `${x.kind}: ${x.title} / ${x.sub}`).join(' · ') : 'none');
    await page.screenshot({ path: path.join(OUT, '4-three-things.png') });
    const g5 = await press('MK-149', 'join');
    ok('4b Answer on a join request opens the contract with the sheet where the lead lets them in', g5.view === 'workspace' && g5.id === 'MK-149' && g5.sheet, JSON.stringify(g5));
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(() => { try { closeModal(); } catch (_) {} const d = deskOf(getContract('MK-149')); d.joinRequests = []; });

    /* ================= 5 · THE OTHER TWO PAGES THAT DRAW THE PANEL ================= */
    await page.evaluate(() => openNegotiations({ list: true })); await page.waitForTimeout(1200);
    const nrow = await page.$('#reg-tbody tr[data-row="MK-149"]');
    if (nrow) { await nrow.click(); await page.waitForTimeout(450); }
    const n = nrow ? await read() : { rows: [] };
    ok('5a the Negotiations page draws the same checklist for the same contract', n.drawn && n.rows.map(x => x.kind).join(',') === 'quiet,review'
      && n.rows[0] && quiet && n.rows[0].title === quiet.title, n.rows.map(x => x.kind + ': ' + x.title).join(' · '));
    await page.evaluate(() => { apSetTab('signatures'); setView('approvals'); }); await page.waitForTimeout(1000);
    const arow = await page.$('.ap-table tbody tr[data-ap-row="MK-158"]');
    if (arow) { await arow.click(); await page.waitForTimeout(450); }
    const ap = arow ? await page.evaluate(() => { const p = document.getElementById('ins-panel');
      return { id: p && p.getAttribute('data-ins-id'), need: !!(p && p.querySelector('.ins-need')), sign: !!(p && p.querySelector('[data-ins-need-row="sign"]')),
        lead: !!(p && p.querySelector('.ins-lead')) }; }) : null;
    ok('5b the Approvals & signing page\'s signing panel leaves the signature out — its own lead already says what stands before signing',
      /* GATED on the Contracts page having drawn the signature row for this very
         contract (2a) — or "left out" is only "never drawn". */
      !!sign && !!ap && ap.id === 'MK-158' && ap.lead && !ap.sign, JSON.stringify(ap));

    /* ================= 6 · NOTHING OWED DRAWS NOTHING ================= */
    await toContracts();
    const k = (await pick('MK-131')) ? await read() : { head: [] };
    ok('6a [control] nothing owed on this contract — no checklist', !k.drawn, JSON.stringify({ drawn: k.drawn }));
    ok('6b [control] and the head is its five rows, exactly as before', k.head.join(' > ') === 'ins-eb > ins-cp > ins-sub > ins-st > ins-acts', k.head.join(' > '));

    /* ================= 7 · THE NIGHT THEME READS THE SAME TOKENS ================= */
    await page.evaluate(() => { if (typeof setDark === 'function') setDark(true); });
    await toContracts();
    const dark = (await pick('MK-149')) ? await page.evaluate(() => {
      const n = document.querySelector('#ins-panel .ins-need');
      if (!n) return null;
      const tok = v => { const e = document.createElement('i'); e.style.cssText = 'position:absolute;color:var(' + v + ')'; document.body.appendChild(e); const c = getComputedStyle(e).color; e.remove(); return c; };
      const head = n.querySelector('.ins-need-h');
      const lum = rgb => { const m = rgb.match(/\d+(\.\d+)?/g).map(Number).slice(0, 3).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]; };
      const ratio = (f, b) => { const a = lum(f), c = lum(b); return (Math.max(a, c) + 0.05) / (Math.min(a, c) + 0.05); };
      const hcs = getComputedStyle(head);
      return { headInk: hcs.color, rubyFg: tok('--st-ruby-fg'), headBg: hcs.backgroundColor, contrast: +ratio(hcs.color, hcs.backgroundColor).toFixed(2) };
    }) : null;
    ok('7a at night the checklist takes the ruby tokens\' own night answers, and its head reads at 4.5:1 or better',
      !!dark && dark.headInk === dark.rubyFg && dark.contrast >= 4.5, JSON.stringify(dark));
    await page.screenshot({ path: path.join(OUT, '7-night.png') });
    await page.evaluate(() => { if (typeof setDark === 'function') setDark(false); });

    /* ================= 8 · HOME'S ROWS AND THE BELL'S ROWS GO WHERE THE BUTTONS WENT =================
       (Young, 27 Sep 2026: "Yes, make them go straight to the right place".)
       Every landing below is compared with the one the checklist's own button
       reached in section 3/4 — a RELATION, never a destination typed out twice.
       BEFORE EVERY PRESS the room is opened on another contract, because the
       room remembers its tab per contract: without that, a row that only
       opened the contract would land on Signing because section 3 left it
       there, and the claim would pass on the fault. */
    const landOf = g => g.view === 'redline' ? 'negotiate:' + g.held
      : g.view + ':' + g.id + ':' + g.tab + (g.sheet ? ':sheet' : '');
    const want = (g, id) => landOf(Object.assign({}, g, { id, held: id }));
    const elsewhere = async () => {
      await page.evaluate(() => { try { closeModal(); } catch (_) {} openWorkspace('MK-150'); });
      await page.waitForTimeout(700);
    };
    const landing = () => page.evaluate(() => ({ view: state.view, id: state.activeId,
      held: (typeof redlineHeldId === 'function') ? redlineHeldId() : null,
      tab: (typeof roomCurrentTab === 'function') ? roomCurrentTab() : null,
      sheet: !!document.getElementById('dk-close') }));
    const homeRows = async () => {
      await page.evaluate(() => setView('dashboard')); await page.waitForTimeout(1100);
      return page.evaluate(() => [...document.querySelectorAll('#hm-dd-rows [data-sel]')].map(b => ({
        id: b.getAttribute('data-sel'), text: b.innerText.replace(/\s+/g, ' ').trim().slice(0, 90) })));
    };
    const pressHome = async i => {
      await elsewhere();
      const rows = await homeRows();
      const b = (await page.$$('#hm-dd-rows [data-sel]'))[i];
      if (!b) return { row: null, g: null, rows };
      await b.click(); await page.waitForTimeout(1300);
      return { row: rows[i], g: await landing(), rows };
    };

    /* 8a–8b: as staged, the card's two rows are the Carrefour review and the
       Carrefour negotiation gone quiet (reviews lead, then quiet deals). */
    const h1 = await pressHome(0);
    ok('8a Home\'s review row opens the negotiation on that contract — where the checklist\'s Review button went',
      !!h1.row && h1.row.id === 'MK-149' && /^Review/i.test(h1.row.text) && landOf(h1.g) === want(g2, 'MK-149'),
      h1.row ? `${h1.row.text} → ${landOf(h1.g)} · button went ${landOf(g2)}` : 'no row: ' + JSON.stringify(h1.rows));
    const h2 = await pressHome(1);
    ok('8b Home\'s quiet-negotiation row opens the negotiation too — where the checklist\'s Answer button went',
      !!h2.row && h2.row.id === 'MK-149' && landOf(h2.g) === want(g1, 'MK-149'),
      h2.row ? `${h2.row.text} → ${landOf(h2.g)} · button went ${landOf(g1)}` : 'no row: ' + JSON.stringify(h2.rows));

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
    const h3 = await pressHome(0);
    ok('8c Home\'s request-to-join row opens the contract with the sheet where the lead lets them in — where the checklist\'s button went',
      !!h3.row && h3.row.id === 'MK-131' && /Peter Kamau/.test(h3.row.text) && landOf(h3.g) === want(g5, 'MK-131'),
      h3.row ? `${h3.row.text} → ${landOf(h3.g)} · button went ${landOf(g5)}` : 'no row: ' + JSON.stringify(h3.rows));
    await page.keyboard.press('Escape').catch(() => {});
    const h4 = await pressHome(1);
    ok('8d Home\'s signature row opens that contract on its Signing tab — where the checklist\'s Sign button went',
      !!h4.row && h4.row.id === 'MK-158' && landOf(h4.g) === want(g3, 'MK-158'),
      h4.row ? `${h4.row.text} → ${landOf(h4.g)} · button went ${landOf(g3)}` : 'no row: ' + JSON.stringify(h4.rows));

    /* 8e: the join request answered, so the card is our signature and the
       Sendy renewal — with the Sendy renewal put away from Prepared for you
       through the product's own act (deskDismiss), because a renewal the desk
       draws is taken off this card by the one-door rule (f274). */
    await page.evaluate(() => { deskOf(getContract('MK-131')).joinRequests = [];
      const r = getContract('MK-143'); deskDismiss(r, 'renewal'); deskDismiss(r, 'notice'); });
    const h5 = await pressHome(1);
    ok('8e Home\'s renewal row opens that contract on its Overview — where the checklist\'s Decide button went',
      !!h5.row && h5.row.id === 'MK-143' && landOf(h5.g) === want(g4, 'MK-143'),
      h5.row ? `${h5.row.text} → ${landOf(h5.g)} · button went ${landOf(g4)}` : 'no row: ' + JSON.stringify(h5.rows));
    await page.screenshot({ path: path.join(OUT, '8-home-renewal-landed.png') });

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
