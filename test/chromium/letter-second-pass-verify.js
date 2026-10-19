/* THE LETTER, SECOND PASS (round 11's gaps, second pass: the checker's list
   against the picked "The letter", 18 Oct 2026)

   WHAT THIS PINS, driven in a real browser against a server whose mail goes
   to a stub provider, on Nordvik's round (their two asks, our counter on
   clause 11 cleared, our counter on clause 7 out with Sara for review):
     1 the note box is small: its label a small grey line, the box hugs what
       is typed (no wider than it needs, never the letter's whole width), no
       grip in its corner
     2 nothing under the letter: what is worth checking stands beside it, in
       "Before you send" (#sh-lt-checks), not below the letter on the page
     3 "The negotiation history" turns the letter into the history's own in
       place: the same page, the side beside it, its subject and its note's
       words the record's; "The contract instead" turns it back
     4 SENT BY EMAIL, THE PAGE CLOSES AND SAYS WHAT WENT: the paper is back
       (Home's, Redlines beside it), the toast "Sent to Anna Holm by email:
       clause 11 and your note. Clause 7 stays here until Sara clears it.",
       and the provider got the mail
     5 A CODE-NAMED DEAL IS NAMED BY ITS CODE AND NUMBER: "Round N of Project
       Falcon (MK-0412)" (the drawing's example says round 2) on the screen and
       in the inbox, the real name nowhere in the mail
     6 the owner's three screens: the history letter beside the panel, the
       checks in the panel, nothing sideways
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/letter-second-pass-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const H = require('../helpers');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || '';
let failures = 0;
const check = (name, pass, detail) => { console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); if (!pass) failures++; };
const shot = async (page, name) => { if (!OUT) return; try { await page.screenshot({ path: path.join(OUT, name + '.png') }); } catch (_) {} };
const pause = ms => new Promise(r => setTimeout(r, ms));
const waitFor = async (page, fn, ms = 8000, arg) => { const end = Date.now() + ms;
  while (Date.now() < end) { const v = await page.evaluate(fn, arg).catch(() => null); if (v) return v; await pause(100); } return null; };
const DOC = ['MASTER SERVICES AGREEMENT', '',
  '1. Parties and purpose', '', 'This Agreement is made between Lindqvist & Co AB, Stockholm (the Customer), and Nordvik Logistik AB, Gothenburg (the Supplier).', '',
  '2. Services', '', 'The Supplier provides the logistics services described in Schedule 1 with reasonable skill and care.', '',
  '7. Liability cap', '', 'Each party\'s total liability under this Agreement in any contract year is capped at 50% of the fees paid in that year.', '',
  '9. Data protection', '', 'The Supplier notifies the Customer of a personal data breach without undue delay.', '',
  '11. Payment terms', '', 'The Customer pays each correct invoice within 30 days of receipt.', '',
  '12. Law and disputes', '', 'Swedish law governs this Agreement. Disputes are settled by arbitration seated in Stockholm.'].join('\n');
const NOTE = 'We can meet you at 45 days on payment.';
const LONG = 'We can meet you at 45 days on payment. Our answer on the liability cap follows this week, once Sara has read it.';

async function mkUser(h, admin, name, email){
  const created = await admin.json('/api/users', { method: 'POST', body: { name, email, role: 'legal', password: 'temporary-pass-1' } });
  const c = h.client(email);
  await c.json('/api/login', { method: 'POST', body: { email, password: 'temporary-pass-1' } });
  await c.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'their-own-pass-9' } });
  return { client: c, user: created.user };
}
const sharePayload = (id, name) => ({ v: 1, kind: 'hati-share', org: 'Lindqvist & Co AB', sharedBy: 'Maria', at: new Date().toISOString(), docHash: 'h1', purpose: 'negotiate', purposeChosen: 'negotiate',
  contract: { id, name, counterparty: 'Nordvik Logistik AB', fields: {}, redlineText: DOC, format: 'text', docText: DOC, versions: [] } });

(async () => {
  const h = await H.startHatiWithMail({}, { HATI_AGENTS_AUTO: 'off' });
  const admin = h.client('admin');
  await admin.json('/api/setup', { method: 'POST', body: { org: 'Lindqvist & Co AB', name: 'Maria Lindgren', email: 'admin@example.co.ke',
    password: 'adminpassword1', data: { uid: 200, contracts: [], settings: {} } } });
  await admin.json('/api/settings', { method: 'PUT', body: { approvalRules: [] } });
  const me = (await admin.json('/api/bootstrap')).me;
  await admin.json('/api/users/' + me.id, { method: 'PATCH', body: { title: 'Legal counsel' } });
  const sara = await mkUser(h, admin, 'Sara Nyström', 'sara@lindqvist.example');
  const shares = {};
  for (const [id, name] of [['MK-0382', 'Master services agreement'], ['MK-0412', 'Warehouse partnership agreement']]) {
    const c0 = H.fixtureContract(id, name, 'Nordvik Logistik AB', H.FOLDER_B, 4200000, 'Under Review', DOC);
    c0.owner = { id: me.id, name: me.name }; c0.metadata = { value: 4200000, currency: 'SEK' };
    await admin.json('/api/contracts/' + id, { method: 'PUT', body: { contract: c0, baseVersion: 0 } });
    shares[id] = await admin.json('/api/shares', { method: 'POST', body: { durable: true, channel: 'link', purpose: 'negotiate', recipient: { name: 'Anna Holm', email: 'anna.holm@nordvik.example' },
      payload: sharePayload(id, name) } });
  }
  /* MK-0412 is a confidential deal: its code name, given by the owner (who
     always knows the real name) */
  const cn = await admin.json('/api/contracts/MK-0412/code-name', { method: 'PUT', body: { code: 'Project Falcon', ids: [] } });

  const b = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  try {
    check('0 the deal took its code name', !!(cn && cn.codeName && cn.codeName.code === 'Project Falcon'), JSON.stringify(cn && cn.codeName));
    const page = await b.newPage({ viewport: { width: 1440, height: 780 } });
    page.on('pageerror', e => errs.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await waitFor(page, () => window.state && state.contracts && ['MK-0382', 'MK-0412'].every(id => state.contracts.some(c => c.id === id)), 20000);
    await page.keyboard.press('Escape').catch(() => {});
    const en = await page.$('.lang-btn[data-lang="en"]'); if (en) await en.click();
    await page.evaluate(() => { try { setBrand('green'); } catch (_) {} try { saveLinkCodeCfg({ on: true }); } catch (_) {} });
    if (await page.evaluate(() => typeof flushSaves === 'function')) await page.evaluate(async () => { await flushSaves(); });
    /* their asks on both deals, answered through the link as Anna would */
    for (const id of ['MK-0382', 'MK-0412']) {
      const cls = await page.evaluate(async id => { const c = getContract(id); if (c._light && typeof ensureFull === 'function') await ensureFull(c);
        return negoClauseList(c).map(k => ({ id: k.clauseId, label: clauseLabel(k), text: String(k.text || k.body || '').trim() })); }, id);
      const ask = (re, a, bb, why) => { const k = cls.find(x => re.test(x.text)); return { clauseId: k.id, clauseLabel: k.label, oldText: k.text, newText: k.text.replace(a, bb), why }; };
      await h.client('anna-' + id).raw('/api/shares/' + shares[id].token + '/respond', { method: 'POST', body: { kind: 'hati-response', action: 'decisions', decisions: [], name: 'Anna Holm', id, at: new Date().toISOString(),
        negoProposed: [ask(/capped at 50%/, '50%', '100%', 'Standard in our contracts.'), ask(/within 30 days/, '30 days', '60 days', 'Our own customers pay us at 60 days.')] } });
    }
    await page.evaluate(async () => { await pollPendingResponses(); });
    await waitFor(page, () => ['MK-0382', 'MK-0412'].every(id => (getContract(id).changes || []).filter(x => x.authorSide === 'counterparty').length >= 2), 10000);
    /* our counters: clause 11 at 45 days (cleared) on both; on MK-0382 clause 7 at 75%, out with Sara */
    await page.evaluate(async (saraU) => {
      for (const id of ['MK-0382', 'MK-0412']) {
        const c = getContract(id);
        const t11 = c.changes.find(x => x.authorSide === 'counterparty' && /60 days/.test(x.newText || ''));
        await negoEditClause(c, t11.clauseId, '<p>The Customer pays each correct invoice within 45 days of receipt.</p>', { side: 'owner', author: 'Maria Lindgren', why: 'We can meet you at 45 days.', onTop: t11.id });
        if (id === 'MK-0382') {
          const t7 = c.changes.find(x => x.authorSide === 'counterparty' && /100%/.test(x.newText || ''));
          const k7 = await negoEditClause(c, t7.clauseId, '<p>Each party\'s total liability under this Agreement in any contract year is capped at 75% of the fees paid in that year.</p>', { side: 'owner', author: 'Maria Lindgren', why: 'Halfway.', onTop: t7.id });
          reviewAsk(c, { reviewer: { id: saraU.id, name: saraU.name, email: saraU.email }, ids: [k7.id] });
        }
        if (window.persist) persist(c);
      }
      if (window.flushSaves) await flushSaves(); }, sara.user);

    const onHome = async id => {
      await page.evaluate(id => { setView('dashboard'); pdOpenOnHome(id, 'copilot'); }, id);
      await waitFor(page, () => !!document.getElementById('ig-canvas'), 10000);
      await page.evaluate(id => pdRedOpen(id), id);
      await waitFor(page, () => !!document.querySelector('#pd-redface [data-nego-card]'), 10000);
    };
    const openLetter = async id => {
      await page.evaluate(id => { const s = document.getElementById('ws-share'); if (s) s.click(); else openShareModal(getContract(id)); }, id);
      const up = await waitFor(page, () => { const s = document.getElementById('share-send'); return !!document.querySelector('#modal-root .modal-in[data-sh-page]') && !!document.querySelector('#pd-sendface .sh-lt-side') && s && !s.disabled; }, 12000);
      await waitFor(page, () => /Anna/.test((document.getElementById('sh-send-lbl') || {}).textContent || ''), 6000);
      return up;
    };
    const press = sel => page.evaluate(s => { const x = document.querySelector(s); if (!x || x.disabled) return false; x.click(); return true; }, sel);
    await onHome('MK-0382');
    check('0b the letter opens on Home beside Jambo', !!(await openLetter('MK-0382')));

    /* 1 the note box is small */
    const box = () => page.evaluate(() => {
      const ta = document.getElementById('sh-summary'), lab = document.getElementById('sh-summary-label');
      const frame = document.querySelector('#sh-letter .sh-lt-note label'), body = document.querySelector('#sh-letter .sh-lt-b') || document.getElementById('sh-letter');
      if (!ta || !lab || !frame) return null;
      const cs = getComputedStyle(ta), ls = getComputedStyle(lab), text = getComputedStyle(document.querySelector('#sh-letter .sh-lt-p') || document.body);
      const grey = c => { const m = /rgba?\((\d+), (\d+), (\d+)/.exec(c); return m ? m.slice(1).map(Number) : null; };
      return { resize: cs.resize, labelPx: parseFloat(ls.fontSize), bodyPx: parseFloat(text.fontSize), labelW: ls.fontWeight, labelInk: grey(ls.color), textInk: grey(text.color),
        frameW: Math.round(frame.getBoundingClientRect().width), bodyW: Math.round(body.clientWidth),
        taH: ta.clientHeight, taSH: ta.scrollHeight, label: lab.textContent.trim() };
    });
    const B0 = await box();
    await page.fill('#sh-summary', NOTE); await pause(150);
    const B1 = await box();
    await page.fill('#sh-summary', LONG); await pause(150);
    const B2 = await box();
    check('1a the note\'s label is a small grey line ("Your note · type here"), not a heading',
      !!B0 && B0.label === 'Your note · type here' && B0.labelPx < B0.bodyPx && Number(B0.labelW) < 600 && JSON.stringify(B0.labelInk) !== JSON.stringify(B0.textInk), JSON.stringify(B0));
    check('1b the box hugs its words (or the hint while empty): a short note a short box, a long line wider, never the letter\'s whole width',
      !!B0 && !!B1 && !!B2 && B0.frameW < B0.bodyW * 0.6 && B1.frameW < B1.bodyW * 0.6 && B2.frameW > B1.frameW && B2.frameW <= Math.ceil(B2.bodyW * 0.7),
      JSON.stringify({ empty: B0 && B0.frameW, short: B1 && B1.frameW, long: B2 && B2.frameW, letter: B2 && B2.bodyW }));
    check('1c it grows downward to hold what is typed, and has no grip in its corner',
      !!B2 && B2.resize === 'none' && B2.taSH <= B2.taH + 1, JSON.stringify({ resize: B2 && B2.resize, h: B2 && B2.taH, sh: B2 && B2.taSH }));
    await page.fill('#sh-summary', NOTE);

    /* 2 nothing under the letter: the checks stand beside it */
    const U = await page.evaluate(() => {
      const pg = document.querySelector('#modal-root .modal-in[data-sh-page]'), L = document.getElementById('sh-letter');
      const lb = L.getBoundingClientRect().bottom;
      const under = [...pg.querySelectorAll('*')].filter(el => !L.contains(el) && !el.contains(L) && el.getClientRects().length)
        .filter(el => { const r = el.getBoundingClientRect(); return r.width > 1 && r.height > 1 && r.top >= lb - 1 && (el.textContent || '').trim(); })
        .map(el => (el.id || el.className || el.tagName) + ':' + el.textContent.replace(/\s+/g, ' ').trim().slice(0, 40));
      const slot = document.querySelector('#pd-sendface #sh-lt-checks');
      return { under, inSide: !!(slot && slot.querySelector('#share-readiness-wrap')), notOnPage: !pg.querySelector('#share-readiness-wrap') };
    });
    check('2a nothing is drawn under the letter on the page', !!U && U.under.length === 0, JSON.stringify(U && U.under.slice(0, 5)));
    check('2b what is worth checking stands beside it, in "Before you send"', !!U && U.inSide && U.notOnPage, JSON.stringify(U));
    await shot(page, '11-note-and-checks-1440x780');

    /* 3 the history in place */
    await page.evaluate(() => { const pg = document.querySelector('#modal-root .modal-in[data-sh-page]'); if (pg) pg.setAttribute('data-c2-same', '1'); });
    const subj0 = await page.evaluate(() => (document.getElementById('sh-lt-subject') || {}).textContent || '');
    await press('#share-other');
    const Hs = await waitFor(page, () => {
      const s = (document.getElementById('sh-lt-subject') || {}).textContent || '';
      if (!/^The negotiation history of /.test(s)) return null;
      const pg = document.querySelector('#modal-root .modal-in[data-sh-page]');
      const kind = document.getElementById('share-step-kind');
      const back = document.querySelector('[data-sh-lt-else="contract"]');
      return { s, same: !!(pg && pg.getAttribute('data-c2-same') === '1'), side: !!document.querySelector('#pd-sendface .sh-lt-side'),
        kindStep: !!(kind && kind.getClientRects().length && kind.getBoundingClientRect().height > 0),
        back: !!(back && back.getClientRects().length), label: (document.getElementById('sh-summary-label') || {}).textContent || '',
        title: (document.getElementById('share-lead-title') || {}).textContent.replace(/\s+/g, ' ').trim(),
        note: document.getElementById('sh-summary').value };
    }, 6000);
    check('3a "The negotiation history" turns the letter into the history\'s in place: the same page, the side beside it, no step between',
      !!Hs && Hs.same && Hs.side && !Hs.kindStep, JSON.stringify(Hs));
    check('3b its subject and title are the record\'s, the note kept', !!Hs && Hs.s === 'The negotiation history of the Master services agreement, from Lindqvist & Co AB'
      && /negotiation history/i.test(Hs.title) && Hs.note === NOTE, JSON.stringify(Hs && { s: Hs.s, t: Hs.title, n: Hs.note }));
    await shot(page, '11-history-in-place-1440x780');
    check('3c "The contract instead" is offered', !!Hs && Hs.back);
    await press('[data-sh-lt-else="contract"]');
    const back = await waitFor(page, s0 => { const s = (document.getElementById('sh-lt-subject') || {}).textContent || ''; return s === s0 ? s : null; }, 6000, subj0);
    check('3d and turns it back to the round, on the same page', !!back && await page.evaluate(() => !!document.querySelector('#modal-root .modal-in[data-sh-page][data-c2-same="1"]')), back);

    /* 4 sent by email: the page closes and says what went */
    h.mail.reset();
    await page.evaluate(() => { const r = document.getElementById('toast-root'); if (r) r.innerHTML = ''; });
    await press('#share-send');
    const got = await (async () => { const t0 = Date.now(); while (Date.now() - t0 < 12000) { const m = h.mail.sent.find(x => /anna\.holm/.test(JSON.stringify(x.to))); if (m) return m; await pause(150); } return null; })();
    check('4a the provider got the mail', !!got, got ? got.subject : 'no mail to Anna');
    const after = await waitFor(page, () => {
      if (document.querySelector('#modal-root .modal-in')) return null;
      const said = [...document.querySelectorAll('#toast-root > *')].map(x => ({ t: x.textContent.replace(/\s+/g, ' ').replace(/[×✕]\s*$/, '').trim(), k: x.dataset.toastKind }));
      if (!said.length) return null;
      const cv = document.getElementById('ig-canvas'); const r = cv ? cv.getBoundingClientRect() : null;
      const hit = r ? document.elementFromPoint(r.left + r.width / 2, r.top + Math.min(200, r.height / 2)) : null;
      return { said, paper: !!(hit && cv.contains(hit)), red: !!document.querySelector('#pd-redface'), face: !!document.getElementById('pd-sendface'),
        /* RE-POINTED 19 Oct 2026 (main's bar): the page's name, not a desk tab */
        tab: /^Send ·/.test(((document.querySelector('#dk-page .dk-page-w') || {}).textContent || '').trim()) };
    }, 10000);
    check('4b the page closes; the paper is back, Redlines beside it; the Send tab goes', !!after && after.paper && after.red && !after.face && !after.tab, JSON.stringify(after));
    const toastSaid = after && after.said.find(x => /^Sent to /.test(x.t));
    check('4c the toast says what went and what stays: "Sent to Anna Holm by email: clause 11 and your note. Clause 7 stays here until Sara clears it."',
      !!toastSaid && /^Sent to Anna Holm by email: clause 11 and your note\. Clause 7 stays here until Sara clears it\.$/.test(toastSaid.t) && toastSaid.k === 'ok', JSON.stringify(after && after.said));
    await shot(page, '11-after-send-1440x780');

    /* 5 a code-named deal */
    const coded = await page.evaluate(() => { const c = getContract('MK-0412'); return c && c._codeName ? c._codeName.code : null; });
    check('5- the owner\'s browser knows the code name', coded === 'Project Falcon', String(coded));
    await onHome('MK-0412');
    await openLetter('MK-0412');
    const C = await page.evaluate(() => ({ s: (document.getElementById('sh-lt-subject') || {}).textContent || '',
      letter: (document.getElementById('sh-letter') || {}).textContent.replace(/\s+/g, ' ') }));
    /* the drawing's "Round 2" is its example's round; this fixture's round is its own */
    const nC = (/^Round (\d+) of /.exec(C.s) || [])[1];
    check('5a on the screen the subject is "Round N of Project Falcon (MK-0412)" — the code and number only', !!nC && C.s === `Round ${nC} of Project Falcon (MK-0412)`, C.s);
    check('5b and the letter never says the real name', !/Warehouse partnership/i.test(C.letter), C.letter.slice(0, 160));
    await pause(500);   /* the page's own arrival settles before the photograph */
    await shot(page, '11-code-name-1440x780');
    h.mail.reset();
    await press('#share-send');
    const gotC = await (async () => { const t0 = Date.now(); while (Date.now() - t0 < 12000) { const m = h.mail.sent.find(x => /anna\.holm/.test(JSON.stringify(x.to))); if (m) return m; await pause(150); } return null; })();
    check('5c the inbox shows the same subject', !!gotC && gotC.subject === C.s, gotC && gotC.subject);
    const leak = gotC ? ['subject', 'text', 'body'].filter(k => /Warehouse partnership/i.test(JSON.stringify(gotC[k] || ''))) : ['no mail'];
    check('5d and the real name is nowhere in the mail', !leak.length, leak.join(', ') || null);
    await waitFor(page, () => !document.querySelector('#modal-root .modal-in'), 8000);

    /* 6 the owner's three screens */
    await onHome('MK-0382');
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht }); await pause(300);
      await openLetter('MK-0382'); await pause(300);
      await page.fill('#sh-summary', LONG); await pause(150);
      const Z1 = await page.evaluate(() => { const pn = document.querySelector('#modal-root .modal-in[data-sh-page]').getBoundingClientRect(), dock = document.getElementById('ig-dock').getBoundingClientRect();
        const frame = document.querySelector('#sh-letter .sh-lt-note label').getBoundingClientRect(), L = document.getElementById('sh-letter').getBoundingClientRect();
        const slot = document.querySelector('#pd-sendface #sh-lt-checks');
        return { beside: pn.right <= dock.left + 1, note: frame.right <= L.right, checks: !!slot && slot.getBoundingClientRect().left >= dock.left - 1,
          side: document.documentElement.scrollWidth <= innerWidth + 1 }; });
      check(`6 ${w}×${ht}: the letter beside the panel, its note inside it, the checks in the panel, nothing sideways`, Z1.beside && Z1.note && Z1.checks && Z1.side, JSON.stringify(Z1));
      await shot(page, `11-letter2-${w}x${ht}`);
      await press('#share-other');
      await waitFor(page, () => /^The negotiation history of /.test((document.getElementById('sh-lt-subject') || {}).textContent || ''), 6000);
      const Z2 = await page.evaluate(() => ({ side: document.documentElement.scrollWidth <= innerWidth + 1, face: !!document.querySelector('#pd-sendface .sh-lt-side') }));
      check(`6 ${w}×${ht}: the history letter in place, nothing sideways`, Z2.side && Z2.face, JSON.stringify(Z2));
      await shot(page, `11-history-${w}x${ht}`);
      await page.evaluate(() => { try { closeModal(); } catch (_) {} });
      await waitFor(page, () => !document.querySelector('#modal-root .modal-in'), 6000);
    }
  } catch (e) { check('the stage ran to the end', false, e && e.stack); }
  finally {
    check('no page errors', !errs.length, errs.slice(0, 3).join(' | '));
    await b.close(); await h.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  }
})();
