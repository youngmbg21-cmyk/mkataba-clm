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

    ok('8 no page errors on the way', errs.length === 0, errs.join(' | '));
  } catch (e) {
    ok('the run finished', false, String(e && e.stack || e).slice(0, 400));
  } finally {
    await browser.close(); await h.stop();
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
  }
})();
