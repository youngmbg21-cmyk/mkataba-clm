/* THE NEW LOOK: NEGOTIATE (the Negotiate round, 31 Oct 2026; the review room's Redlines, Drag the counter, Clause editor,
   The close plan, Where we are, History, Send; behind the switch). A SaaS agreement on which the other side asked two
   figures: 60 days to pay (the standard is 45 at most) and 6 months' liability (the standard is 12 at least). With the
   switch on, at the owner's three screens:
     1 · their asks beside the redlined paper, numbered, each with Counter at the limit; one grey note for what they left alone
     2 · the Redlines face's four links above Jambo's box: ladder · notes · their view · history
     3 · the close plan: one table (Point · us · them · Stand), a point opens to compare, the two wordings side by side
     4 · Send: the questions a column of lines, the letter beside them; a line pressed opens its list; From among the lines;
         Before you send in labelled rows
     5 · History: the quick links (only those that give rows), one press narrows the trail
     6 · Where we are: one column, flat
     7 · the clause editor's card shows the suggested wording marked against theirs; Apply puts it in the box
   Then, once, at the first screen:
     8 · the note's Counter at 45 files OUR counter on top of their ask (nothing sent)
     9 · their figure dragged on the paper to 50 files our counter "50" on top of theirs
   And the switch off:
    10 · no notes beside the paper, no quick links, the close plan as before
   At the parent (before this round) 1–9 fail: none of it is drawn.
   Run: node test/chromium/negotiate-new-look-verify.js   (pictures: NEGOTIATE_SHOTS=<dir>) */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = process.env.NEGOTIATE_SHOTS || path.join(__dirname, 'shots', 'negotiate-new-look');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };

const HT = '<h1>Software as a Service Agreement</h1><p>Between Highland Corporate Ltd and Parcelway Logistics Ltd</p>'
  + '<h2>1. Scope</h2><p>The Supplier shall deliver the Services described in Schedule 1 to the Customer for the Term, at the service levels in Schedule 2.</p>'
  + '<h2>5. Payment</h2><p>Customer shall pay each correct invoice within 30 days of receipt.</p>'
  + '<h2>12. Data</h2><p>Each Party shall process personal data only as the Data Processing Schedule allows and shall notify the other of a breach within seventy-two (72) hours.</p>'
  + '<h2>26. Limitation of liability</h2><p>Each Party\'s total liability under this agreement shall not exceed twelve (12) months of Charges paid or payable in the year the claim arises.</p>'
  + '<h2>27. Governing law</h2><p>This agreement is governed by the laws of Kenya and the courts of Nairobi have exclusive jurisdiction.</p>';
const mk = (id, name) => {
  const c = fixtureContract(id, name, 'Parcelway Logistics Ltd', 'proc', 2400000, 'Under Review', 'x');
  return Object.assign(c, { redlineText: HT, format: 'rich', template: null, source: 'upload', fields: {}, contractType: 'Software as a service',
    upload: { name: 'Parcelway_SaaS.docx', extractedText: HT.replace(/<[^>]+>/g, ' '), uploadedAt: new Date().toISOString(), uploadedBy: 'Amina Otieno' } });
};
/* their round: two asks, filed through the one funnel as the other side would. Filed IN THE PAGE that reads them: the server
   keeps the other side's changes only from their own link (the wall), so a refresh would lose them; each page has its own contract */
const THEIR_ROUND = async id => {
  const c = getContract(id); if (window.ensureFull) await ensureFull(c);
  const cls = negoClauseList(c).filter(x => x && x.clauseId && x.clauseId !== 'front');
  const by = re => cls.find(x => re.test((typeof clauseLabel === 'function' ? clauseLabel(x) : '') + ' ' + (x.headingText || '')));
  for (const [re, edit] of [[/Payment/, b => b.replace('within 30 days of receipt.', 'within 60 days of receipt. Disputed amounts may be withheld until the dispute is resolved under clause 24.')],
    [/Limitation/, b => b.replace('twelve (12) months', 'six (6) months')]]){
    const cl = by(re); if (!cl) continue; const now = negoClauseNowById(c, cl.clauseId);
    const body = (now && now.bodyHtml) || '<p>' + ((now && now.text) || '') + '</p>';
    await negoEditClause(c, cl.clauseId, edit(body), { side: 'counterparty', author: 'Erik Lindqvist' });
  }
  c.negotiation = Object.assign({}, c.negotiation || {}, { round: 1, turn: 'owner' });
  await persist(c);
};
const open = async (page, base, nl, W, H) => {
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
  await until(page, () => typeof openRedlineWorkbench === 'function' && typeof currentUser === 'function' && !!currentUser(), null, 40000);
  await page.evaluate(async on => { await stPrefSet('newLook', on); newLookApply(); }, nl);
};
const face = async (page, id) => {
  await page.evaluate(i => openRedlineWorkbench(i), id);
  return until(page, () => !!document.querySelector('#ig-dock [data-nego-reject]'), null, 20000);
};
const back = async page => { await page.keyboard.press('Escape'); await page.waitForTimeout(150); };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const IDS = ['MK-R1', 'MK-R2', 'MK-R3', 'MK-R4', 'MK-R5', 'MK-R6'];
  await seedWorkspace(h, { contracts: IDS.map((id, i) => mk(id, i === 4 ? 'Parcel Tracking SaaS' : 'Parcel Delivery SaaS')), approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  try {
    for (const [nm, W, H, ID] of [['laptop-a', 1440, 780, 'MK-R1'], ['laptop-b', 1536, 730, 'MK-R2'], ['ipad', 1366, 950, 'MK-R3']]){
      const page = await browser.newPage({ viewport: { width: W, height: H } });
      page.on('pageerror', e => console.log('PAGE ERROR', String(e).slice(0, 300)));
      await open(page, h.base, true);
      await page.evaluate(THEIR_ROUND, ID);
      const up = await face(page, ID);
      /* 1 · the notes beside the redlined paper */
      await until(page, () => document.querySelectorAll('#pd2-notes .pd2-mn').length >= 3, null, 10000);
      const n1 = await page.evaluate(() => {
        const host = document.getElementById('pd2-notes'), sheet = document.querySelector('#ig-paper .ig-zoom article, #ig-paper .ig-zoom .pg-sheet');
        const ns = host ? [...host.querySelectorAll('.pd2-mn')].map(n => ({ t: n.textContent.replace(/\s+/g, ' ').trim().slice(0, 70), left: n.getBoundingClientRect().left })) : [];
        return { up: true, ns, counters: host ? [...host.querySelectorAll('[data-rl-1p-counter]')].map(b => b.textContent.trim()) : [], sheetRight: sheet ? sheet.getBoundingClientRect().right : null, sideways: document.documentElement.scrollWidth - innerWidth };
      });
      check(`${nm} 1 their asks beside the paper, numbered, Counter at the limit; what they left alone said once`, up && n1.ns.length >= 3
        && /^1\s*Parcelway asks 60 days/.test(n1.ns[0].t) && /^2\s*Parcelway asks 6 months/.test(n1.ns[1].t)
        && n1.ns.some(n => /^Untouched: scope, data, governing law/.test(n.t))
        && n1.counters.some(t => /Counter at 45/.test(t)) && n1.counters.some(t => /Counter at 12/.test(t))
        && n1.ns.every(n => n1.sheetRight != null && n.left >= n1.sheetRight) && n1.sideways <= 0, n1);
      /* 2 · the face's four links above the box */
      const links = await page.evaluate(() => { const r = document.querySelector('#ig-dock [data-ig-chips]'); return r && r.getBoundingClientRect().height ? [...r.querySelectorAll('[data-ca-chip]')].map(b => b.textContent.trim()).join(' · ') : ''; });
      check(`${nm} 2 four links above Jambo's box`, links === 'ladder · notes · their view · history', links);
      await page.screenshot({ path: path.join(OUT, `redlines-${nm}.png`) });
      /* 3 · the close plan */
      await page.evaluate(id => pdDealOpen(id), ID);
      await until(page, () => !!document.querySelector('#modal-root .dl2-t'), null, 10000);
      await page.click('#modal-root [data-deal-toggle]').catch(() => {});
      await until(page, () => !!document.querySelector('#modal-root .dl2-cmp'), null, 5000);
      const d3 = await page.evaluate(() => ({
        title: (document.querySelector('#modal-root .dl2-h') || {}).textContent || '',
        heads: [...document.querySelectorAll('#modal-root .dl2-th span')].map(s => s.textContent.trim()),
        rows: [...document.querySelectorAll('#modal-root .dl2-r')].map(r => [r.querySelector('.dl2-pt b').textContent, r.querySelector('.dl2-us').textContent, r.querySelector('.dl2-them').textContent, r.querySelector('.dl2-st').textContent].map(x => x.replace(/\s+/g, ' ').trim())),
        cmpCols: document.querySelectorAll('#modal-root .dl2-cmp-b > div').length,
        cmpMarks: !!document.querySelector('#modal-root .dl2-cmp .dl2-w ins, #modal-root .dl2-cmp .dl2-w del, #modal-root .dl2-cmp .dl2-w .rl-ins, #modal-root .dl2-cmp .dl2-w .rl-del'),
        foot: [...document.querySelectorAll('#modal-root .dl2-foot button')].map(b => b.textContent.trim()) }));
      check(`${nm} 3 the close plan: one table, a point opens to compare side by side`, /^The close plan/.test(d3.title)
        && d3.heads.join('|') === 'Point|Highland Corporate Ltd|Parcelway Logistics Ltd|Stand'
        && d3.rows.length === 1 && /Liability/.test(d3.rows[0][0]) && d3.rows[0][1] === '12 months' && d3.rows[0][2] === '6 months'
        && d3.cmpCols === 2 && d3.cmpMarks && d3.foot.includes('Send'), d3);
      await page.screenshot({ path: path.join(OUT, `close-plan-${nm}.png`) });
      await back(page);
      /* 4 · Send */
      await page.evaluate(() => { const b = document.getElementById('ws-share'); if (b) b.click(); });
      await until(page, () => !!document.querySelector('#sh-letter.is-sap'), null, 10000);
      await page.waitForTimeout(400);
      const s4 = await page.evaluate(() => {
        const L = document.getElementById('sh-letter'), lines = document.getElementById('sh-as-chips'), mail = L && L.querySelector('.sh-lt-mail');
        const a = lines && lines.getBoundingClientRect(), b = mail && mail.getBoundingClientRect();
        return { grid: L ? getComputedStyle(L).display : '', beside: !!(a && b && b.left >= a.right && Math.abs(b.top - a.top) < 40),
          from: !!(lines && lines.querySelector('#sh-lt-from')), keys: [...document.querySelectorAll('#ig-dock .sh-lt-card > h4, #ig-dock .sh-kv > span')].map(x => x.textContent.trim()) };
      });
      await page.click('[data-sh-as-go="purpose"]').catch(() => {});
      const opened = await until(page, () => !!document.querySelector('[data-sh-as="purpose"].is-open'), null, 3000);
      check(`${nm} 4 Send: lines on the left, the letter beside them, a line opens its list, From among the lines, Before you send in rows`,
        s4.grid === 'grid' && s4.beside && s4.from && opened && s4.keys.includes('Held back') && s4.keys.includes('Goes') && s4.keys.includes('Names'), Object.assign(s4, { opened }));
      await page.screenshot({ path: path.join(OUT, `send-${nm}.png`) });
      await page.keyboard.press('Escape'); await page.waitForTimeout(150);
      await page.evaluate(() => { const x = document.querySelector('#modal-root [data-dlg-cancel]'); if (x) x.click(); });
      await page.waitForTimeout(300);
      /* 5 · History */
      await face(page, ID);
      await page.click('#ig-dock [data-ca-chip="history"]').catch(() => {});
      await until(page, () => !!document.querySelector('.hist-quick'), null, 10000);
      const h5a = await page.evaluate(() => ({ links: [...document.querySelectorAll('.hist-quick [data-ht-quick]')].map(b => b.textContent.trim()), rows: document.querySelectorAll('.hist-trail .hist-ev').length, selects: document.querySelectorAll('.hist-tools select').length }));
      await page.click('.hist-quick [data-ht-quick="theirs"]').catch(() => {});
      await page.waitForTimeout(300);
      const h5b = await page.evaluate(() => ({ rows: document.querySelectorAll('.hist-trail .hist-ev').length, sides: [...document.querySelectorAll('.hist-trail .hist-ev .hist-sd')].map(s => s.textContent.trim()) }));
      check(`${nm} 5 History: quick links that give rows, one press narrows`, h5a.links.join(' · ') === 'theirs' && h5a.selects === 0
        && h5b.rows === 2 && h5a.rows > h5b.rows && h5b.sides.every(s => s === 'Theirs'), { h5a, h5b });
      await page.screenshot({ path: path.join(OUT, `history-${nm}.png`) });
      /* 6 · Where we are */
      await page.evaluate(id => hbStripBring(id, 'where'), ID);
      await until(page, () => !!document.querySelector('#hb-board .ds-sheet'), null, 10000);
      const w6 = await page.evaluate(() => { const a = document.querySelector('#hb-board .ds-sheet .ds-open'), b = document.querySelector('#hb-board .ds-sheet .ds-side');
        return { stacked: !!(a && b && b.getBoundingClientRect().top >= a.getBoundingClientRect().bottom - 1), border: a ? getComputedStyle(a).borderTopWidth : '' }; });
      check(`${nm} 6 Where we are: one column, flat`, w6.stacked && w6.border === '0px', w6);
      await page.screenshot({ path: path.join(OUT, `where-${nm}.png`) });
      /* 7 · the clause editor's card */
      await face(page, ID);
      await page.click('#ig-dock [data-rl-cp-editor-row]').catch(() => {});
      await until(page, () => !!document.querySelector('.ce-lcard .ce-lc-sug'), null, 15000);
      const e7a = await page.evaluate(() => ({ sug: !!document.querySelector('.ce-lcard .ce-lc-sug ins'), apply: (document.querySelector('[data-ce-act="ladder-apply"]') || {}).textContent || '' }));
      await page.click('[data-ce-act="ladder-apply"]').catch(() => {});
      await page.waitForTimeout(400);
      const e7b = await page.evaluate(() => (document.getElementById('ce-clausebody') || {}).textContent || '');
      check(`${nm} 7 the editor's card: the suggested wording marked against theirs; Apply puts it in the box`, e7a.sug && e7a.apply.trim() === 'Apply' && /45/.test(e7b), { e7a, e7b: e7b.slice(0, 80) });
      await page.screenshot({ path: path.join(OUT, `editor-${nm}.png`) });
      await page.close();
    }
    /* 8 and 9 · once, at the first screen: a note's Counter files ours on top; the dial files a counter */
    { const page = await browser.newPage({ viewport: { width: 1440, height: 780 } });
      await open(page, h.base, true);
      await page.evaluate(THEIR_ROUND, 'MK-R4'); await page.evaluate(THEIR_ROUND, 'MK-R5');
      await face(page, 'MK-R4');
      await until(page, () => !!document.querySelector('#pd2-notes [data-rl-1p-counter]'), null, 10000);
      await page.evaluate(() => { const b = [...document.querySelectorAll('#pd2-notes [data-rl-1p-counter]')].find(x => /45/.test(x.textContent)); if (b) b.click(); });
      await until(page, () => (getContract('MK-R4').changes || []).some(x => x.authorSide === 'owner'), null, 10000);
      const c8 = await page.evaluate(() => { const L = getContract('MK-R4').changes || []; const o = L.find(x => x.authorSide === 'owner'), t = L.find(x => x.authorSide === 'counterparty' && /Payment/.test(x.clauseLabel || ''));
        return { ours: o ? { text: String(o.newText || '').slice(0, 80), on: o.counterOf || o.onTop || '' } : null, theirs: t ? t.status : '', sent: !!(o && o.sentAt) }; });
      check('8 the note\'s Counter at 45 files our counter on top of their ask, nothing sent', !!(c8.ours && /45/.test(c8.ours.text) && !c8.sent && c8.theirs === 'countered'), c8);
      await face(page, 'MK-R5');
      const dial = await until(page, () => !!document.querySelector('#ig-canvas [data-pd2-dial]'), null, 10000);
      if (dial){
        const f = await page.$('#ig-canvas [data-pd2-dial]'); const b = await f.boundingBox();
        await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await page.waitForTimeout(150);
        const t = await page.$('#ig-canvas .pd2-dial-track'); const tb = t ? await t.boundingBox() : null;
        if (tb){ await page.mouse.move(tb.x + tb.width * (20 / 30), tb.y + 2, { steps: 8 }); await page.waitForTimeout(150); }
        await page.mouse.up();
        await until(page, () => (getContract('MK-R5').changes || []).some(x => x.authorSide === 'owner'), null, 8000);
      }
      const c9 = await page.evaluate(() => { const o = (getContract('MK-R5').changes || []).find(x => x.authorSide === 'owner'); return o ? String(o.newText || '').slice(0, 80) : ''; });
      check('9 their figure dragged to 50 files our counter "50" on top of theirs', dial && /\b50\b/.test(c9), { dial, c9 });
      await page.close(); }
    /* 10 · the switch off */
    { const page = await browser.newPage({ viewport: { width: 1440, height: 780 } });
      await open(page, h.base, false);
      await page.evaluate(THEIR_ROUND, 'MK-R6');
      await face(page, 'MK-R6');
      await page.waitForTimeout(800);
      const off = await page.evaluate(() => ({ notes: document.querySelectorAll('#pd2-notes .pd2-mn').length }));
      await page.evaluate(() => pdDealOpen('MK-R6'));
      await until(page, () => !!document.querySelector('#modal-root [data-deal-mid]'), null, 10000);
      off.dl2 = !!document.querySelector && await page.evaluate(() => !!document.querySelector('#modal-root .dl2'));
      check('10 the switch off: no notes beside the paper, the close plan as before', off.notes === 0 && !off.dl2, off);
      await page.close(); }
  } finally { await browser.close(); await h.stop(); }
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
