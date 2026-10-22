/* THE LETTER, AS DRAWN (round 11's gaps: the owner's "build all the gaps",
   18 Oct 2026; the picked option "The letter", and "1. Keep it.": the note is
   still the only part the sender writes)

   WHAT THIS PINS, driven in a real browser against a server whose mail goes
   to a stub provider, on Nordvik's round: their two asks, our counter on
   clause 11 cleared and our counter on clause 7 out with Sara for review
     1 on Home, Share opens the letter as a PAGE on the desk: the desk tab
       "Send · MK-0382" in front (the paper's own tab waiting), the head
       "Send round N" with "to Nordvik Logistik AB · MK-0382", Send to Anna and
       Cancel in it; "Before you send" is a face of Jambo's panel beside it
       (the panel's row: Jambo, "Before you send", ‹ Jambo), with the ask box
     2 the letter as drawn: From "Maria Lindgren, Lindqvist & Co AB · sent by
       HaTi"; To as a line with Change; Subject "Round N of the Master services
       agreement, from Lindqvist & Co AB"; Sent as four small choices; "Hello
       Anna,", the note's dashed box "Your note · type here", "… has answered 1
       of your 2 redlines:" with "Clause 11 · Payment terms: they propose 45
       days (you asked for 60).", the button "Open round N", what the link lets
       them do and the one-time code, the sign-off with the job title
     3 the chips open their own lists (the same controls); a press again or Esc
       puts a list away and leaves the page; Change opens the two boxes
     4 what stays here: "Clause 7 stays here", Sara named (the requester may
       see the review), Remind Sara (the review's own reminder: it reaches her)
       and Go to clause 7; "What Anna never sees"
     5 SENT, IT IS THE SAME EMAIL: subject and words as the screen showed them,
       the real link under the button's words, and an HTML part whose button
       carries the link
     6 the ways back: Cancel, ‹ Jambo, the tab's × and the paper's tab each put
       the page and the face away together; the Redlines face is back
     7 the owner's three screens: the head and Send in view, the letter beside
       the panel and not under it, nothing sideways
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/the-letter-as-drawn-verify.js */
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
const NOTE = 'We can meet you at 45 days on payment. Our answer on the liability cap follows this week.';

async function mkUser(h, admin, name, email){
  const created = await admin.json('/api/users', { method: 'POST', body: { name, email, role: 'legal', password: 'temporary-pass-1' } });
  const c = h.client(email);
  await c.json('/api/login', { method: 'POST', body: { email, password: 'temporary-pass-1' } });
  await c.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'their-own-pass-9' } });
  return { client: c, user: created.user };
}

(async () => {
  const h = await H.startHatiWithMail({}, { HATI_AGENTS_AUTO: 'off' });
  const admin = h.client('admin');
  await admin.json('/api/setup', { method: 'POST', body: { org: 'Lindqvist & Co AB', name: 'Maria Lindgren', email: 'admin@example.co.ke',
    password: 'adminpassword1', data: { uid: 200, contracts: [], settings: {} } } });
  await admin.json('/api/settings', { method: 'PUT', body: { approvalRules: [] } });
  const me = (await admin.json('/api/bootstrap')).me;
  await admin.json('/api/users/' + me.id, { method: 'PATCH', body: { title: 'Legal counsel' } });
  const sara = await mkUser(h, admin, 'Sara Nyström', 'sara@lindqvist.example');
  const c0 = H.fixtureContract('MK-0382', 'Master services agreement', 'Nordvik Logistik AB', H.FOLDER_B, 4200000, 'Under Review', DOC);
  c0.owner = { id: me.id, name: me.name }; c0.metadata = { value: 4200000, currency: 'SEK' };
  await admin.json('/api/contracts/MK-0382', { method: 'PUT', body: { contract: c0, baseVersion: 0 } });
  const share = await admin.json('/api/shares', { method: 'POST', body: { durable: true, channel: 'link', purpose: 'negotiate', recipient: { name: 'Anna Holm', email: 'anna.holm@nordvik.example' },
    payload: { v: 1, kind: 'hati-share', org: 'Lindqvist & Co AB', sharedBy: 'Maria', at: new Date().toISOString(), docHash: 'h1', purpose: 'negotiate', purposeChosen: 'negotiate',
      contract: { id: 'MK-0382', name: 'Master services agreement', counterparty: 'Nordvik Logistik AB', fields: {}, redlineText: DOC, format: 'text', docText: DOC, versions: [] } } } });

  const b = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  try {
    const page = await b.newPage({ viewport: { width: 1440, height: 780 } });
    page.on('pageerror', e => errs.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await waitFor(page, () => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-0382'), 20000);
    await page.keyboard.press('Escape').catch(() => {});
    /* RE-POINTED 20 Oct 2026 (the owner picked "Chambers"): the bar's language
       switch and the brand picker are gone — langSet is the one language
       writer, and there is one look, so no brand is chosen */
    await page.evaluate(() => { if (typeof langId === 'function' && langId() !== 'en') langSet('en'); try { saveLinkCodeCfg({ on: true }); } catch (_) {} });
    if (await page.evaluate(() => typeof flushSaves === 'function')) await page.evaluate(async () => { await flushSaves(); });
    const cls = await page.evaluate(async () => { const c = getContract('MK-0382'); if (c._light && typeof ensureFull === 'function') await ensureFull(c);
      return negoClauseList(c).map(k => ({ id: k.clauseId, label: clauseLabel(k), text: String(k.text || k.body || '').trim() })); });
    const ask = (re, a, bb, why) => { const k = cls.find(x => re.test(x.text)); return { clauseId: k.id, clauseLabel: k.label, oldText: k.text, newText: k.text.replace(a, bb), why }; };
    await h.client('anna').raw('/api/shares/' + share.token + '/respond', { method: 'POST', body: { kind: 'hati-response', action: 'decisions', decisions: [], name: 'Anna Holm', id: 'MK-0382', at: new Date().toISOString(),
      negoProposed: [ask(/capped at 50%/, '50%', '100%', 'Standard in our contracts.'), ask(/within 30 days/, '30 days', '60 days', 'Our own customers pay us at 60 days.')] } });
    await page.evaluate(async () => { await pollPendingResponses(); });
    await waitFor(page, () => (getContract('MK-0382').changes || []).filter(x => x.authorSide === 'counterparty').length >= 2, 10000);
    /* our counters: clause 11 at 45 days (cleared), clause 7 at 75% (out with Sara) */
    await page.evaluate(async (saraU) => { const c = getContract('MK-0382');
      const t11 = c.changes.find(x => x.authorSide === 'counterparty' && /60 days/.test(x.newText || ''));
      const t7 = c.changes.find(x => x.authorSide === 'counterparty' && /100%/.test(x.newText || ''));
      await negoEditClause(c, t11.clauseId, '<p>The Customer pays each correct invoice within 45 days of receipt.</p>', { side: 'owner', author: 'Maria Lindgren', why: 'We can meet you at 45 days.', onTop: t11.id });
      const k7 = await negoEditClause(c, t7.clauseId, '<p>Each party\'s total liability under this Agreement in any contract year is capped at 75% of the fees paid in that year.</p>', { side: 'owner', author: 'Maria Lindgren', why: 'Halfway.', onTop: t7.id });
      reviewAsk(c, { reviewer: { id: saraU.id, name: saraU.name, email: saraU.email }, ids: [k7.id] });
      if (window.persist) persist(c); if (window.flushSaves) await flushSaves(); }, sara.user);
    await page.evaluate(() => { setView('dashboard'); pdOpenOnHome('MK-0382', 'copilot'); });
    await waitFor(page, () => !!document.getElementById('ig-canvas'), 10000);
    await page.evaluate(() => pdRedOpen('MK-0382'));
    await waitFor(page, () => !!document.querySelector('#pd-redface [data-nego-card]'), 10000);
    /* the paper's own tab is kept once the page has settled (deskTabsSync) */
    await waitFor(page, () => { try { return JSON.stringify(localStorage.getItem('hati.v1.deskTabs') || '').includes('c:MK-0382'); } catch (_) { return false; } }, 6000);

    const openLetter = async () => {
      await page.evaluate(() => { const s = document.getElementById('ws-share'); if (s) s.click(); else openShareModal(getContract('MK-0382')); });
      return waitFor(page, () => { const s = document.getElementById('share-send'); return !!document.querySelector('#modal-root .modal-in[data-sh-page]') && !!document.querySelector('#pd-sendface .sh-lt-side') && s && !s.disabled; }, 12000);
    };
    /* 1 the page and the face */
    const up = await openLetter();
    check('1a Share on Home opens the letter as a page beside Jambo', !!up);
    await waitFor(page, () => /Anna/.test((document.getElementById('sh-send-lbl') || {}).textContent || ''), 6000);
    const F1 = await page.evaluate(() => {
      const t = s => { const e = document.querySelector(s); return e ? e.textContent.replace(/\s+/g, ' ').trim() : null; };
      /* RE-POINTED 19 Oct 2026 (main's bar, the SAP way: no desk tabs row): the
         bar names the page in front, the paper waits as a Recent row */
      const tabs = (typeof deskRecentRows === 'function' ? deskRecentRows() : []).map(t => ({ w: deskTabLabel(t.k), on: t.k === deskKeyNow() }));
      const barName = ((document.querySelector('#dk-page .dk-page-w') || {}).textContent || '').trim();
      const acts = [...document.querySelectorAll('#modal-root .sh-hd-acts > button')].map(x => x.textContent.replace(/\s+/g, ' ').trim());
      const panel = document.querySelector('#modal-root .modal-in[data-sh-page]').getBoundingClientRect(), dock = document.getElementById('ig-dock').getBoundingClientRect();
      return { tabs, barName, title: t('#share-lead-title'), acts, faceWord: t('#ig-dock > .pd-trail .pd-trail-w b'), back: !!document.querySelector('#ig-dock > .pd-trail [data-pd-back="send"]'),  /* ONE TRAIL (20 Oct 2026) */
        jsay: t('#pd-sendface #sh-lt-jsay'), ask: !!document.querySelector('#ig-dock #igd-input'), beside: panel.right <= dock.left + 1 };
    });
    check('1b the bar names "Send · MK-0382" in front; the paper waits as its own Recent row',
      F1.barName === 'Send · MK-0382' && F1.tabs.some(x => x.w === 'Send · MK-0382' && x.on) && F1.tabs.some(x => /MK-0382$/.test(x.w) && !/^Send/.test(x.w) && !x.on), JSON.stringify({ bar: F1.barName, tabs: F1.tabs }));
    check('1c the head: "Send round N to Nordvik Logistik AB · MK-0382", Send to Anna and Cancel', /^Send round \d+ to Nordvik Logistik AB · MK-0382$/.test(F1.title || '')
      && JSON.stringify(F1.acts) === JSON.stringify(['Send to Anna', 'Cancel']), JSON.stringify({ t: F1.title, a: F1.acts }));
    check('1d "Before you send" is a face of Jambo\'s panel, its way back on the trail line, the ask box at its foot, beside the page',
      F1.faceWord === 'Before you send' && F1.back && /^This is the email Anna will get, word for word\./.test(F1.jsay || '') && F1.ask && F1.beside, JSON.stringify(F1));
    await shot(page, '11-letter-first-1440x780');

    /* 2 the letter */
    await page.fill('#sh-summary', NOTE);
    const L = await page.evaluate(() => {
      const t = id => { const e = document.getElementById(id); return e ? e.textContent.replace(/\s+/g, ' ').trim() : null; };
      const chips = [...document.querySelectorAll('#sh-as-chips .sh-as:not(.hidden) [data-sh-as-go]')].map(x => x.textContent.trim());
      const ps = sel => [...document.querySelectorAll(sel + ' .sh-lt-p')].map(p => p.querySelector('[data-sh-lt-btn]') ? '{BTN:' + p.textContent.trim() + '}' : p.textContent.replace(/\s+/g, ' ').trim());
      const cs = getComputedStyle(document.querySelector('#sh-letter .sh-lt-note label'));
      return { from: t('sh-lt-from'), to: t('sh-lt-towho'), toShown: !document.getElementById('sh-lt-tosay').classList.contains('hidden'),
        boxesHidden: document.querySelector('#sh-letter .sh-lt-who').classList.contains('hidden'), subject: t('sh-lt-subject'), chips,
        before: ps('#sh-lt-before'), after: ps('#sh-lt-after'), noteLbl: t('sh-summary-label'), dashed: cs.borderTopStyle,
        head: (document.getElementById('sh-lt-msghead') || {}).className || '' };
    });
    const n = (/^Round (\d+)/.exec(L.subject || '') || [])[1];
    check('2a From, To as a line, Subject as drawn', L.from === 'Maria Lindgren, Lindqvist & Co AB · sent by HaTi' && L.toShown && L.boxesHidden
      && L.to === 'Anna Holm · anna.holm@nordvik.example' && L.subject === `Round ${n} of the Master services agreement, from Lindqvist & Co AB`, JSON.stringify(L));
    check('2b Sent as: four small choices that read as a sentence', JSON.stringify(L.chips) === JSON.stringify(['a link to negotiate', 'by email', 'open for the whole negotiation', `the contract, round ${n}`]), JSON.stringify(L.chips));
    check('2c Hello, then the note in its dashed box, with no heading in the email', JSON.stringify(L.before) === JSON.stringify(['Hello Anna,']) && L.noteLbl === 'Your note · type here'
      && L.dashed === 'dashed' && /hidden/.test(L.head), JSON.stringify({ b: L.before, l: L.noteLbl, d: L.dashed, h: L.head }));
    check('2d what this round answers, the button, the link\'s promise with the code, the sign-off', JSON.stringify(L.after) === JSON.stringify([
      'Lindqvist & Co AB has answered 1 of your 2 redlines:', 'Clause 11 · Payment terms: they propose 45 days (you asked for 60).', `{BTN:Open round ${n}}`,
      'You can propose changes on your own page. Nothing can be signed on this link. Before the page opens, we send a one-time code to this address.',
      'Maria Lindgren · Legal counsel · Lindqvist & Co AB']), JSON.stringify(L.after));

    /* 3 the chips and Change */
    const press = sel => page.evaluate(s => { const x = document.querySelector(s); if (!x || x.disabled) return false; x.click(); return true; }, sel);
    await press('[data-sh-as-go="ch"]');
    const c1 = await page.evaluate(() => { const box = document.querySelector('[data-sh-as="ch"]'), seg = box.querySelector('[data-share-ch="email"]');
      return { open: box.classList.contains('is-open'), seg: !!seg && !!seg.getClientRects().length }; });
    await page.keyboard.press('Escape');
    const c2 = await page.evaluate(() => ({ open: document.querySelector('[data-sh-as="ch"]').classList.contains('is-open'), page: !!document.querySelector('#modal-root .modal-in[data-sh-page]') }));
    await press('[data-sh-as-go="ch"]'); await press('[data-sh-as-go="ch"]');
    const c3 = await page.evaluate(() => document.querySelector('[data-sh-as="ch"]').classList.contains('is-open'));
    check('3a a chip opens its own list of the screen\'s own controls; Esc puts it away and leaves the page; a press again closes it',
      c1.open && c1.seg && !c2.open && c2.page && !c3, JSON.stringify({ c1, c2, c3 }));
    await press('[data-sh-as-go="purpose"]'); await press('[data-sh-as="purpose"] [data-share-purpose="view"]');
    /* the list puts itself away a beat after the choice (shareLetterAsWire's setTimeout 0): ask for that state, bounded */
    const c4read = () => ({ w: document.querySelector('[data-sh-as-w="purpose"]').textContent, s: document.getElementById('sh-lt-subject').textContent,
      open: document.querySelector('[data-sh-as="purpose"]').classList.contains('is-open') });
    await waitFor(page, () => !document.querySelector('[data-sh-as="purpose"]').classList.contains('is-open'), 3000);
    const c4 = await page.evaluate(c4read);
    check('3b a choice in a list is the screen\'s own choice: the chip and the letter follow it, the list goes', c4.w === 'a link to read' && /^The Master services agreement, from /.test(c4.s) && !c4.open, JSON.stringify(c4));
    await press('[data-sh-as-go="purpose"]'); await press('[data-sh-as="purpose"] [data-share-purpose="negotiate"]');
    await press('#sh-lt-change');
    const c5 = await page.evaluate(() => ({ boxes: !document.querySelector('#sh-letter .sh-lt-who').classList.contains('hidden'), line: !document.getElementById('sh-lt-tosay').classList.contains('hidden') }));
    check('3c Change opens the two boxes', c5.boxes && !c5.line, JSON.stringify(c5));

    /* 4 what stays here */
    const S = await page.evaluate(() => { const card = document.querySelector('#pd-sendface .sh-lt-card.is-stays');
      const never = document.getElementById('sh-lt-never-h');
      return card ? { h: card.querySelector('h4').textContent.trim(), p: card.querySelector('p').textContent.trim(),
        acts: [...card.querySelectorAll('button')].filter(b => b.getClientRects().length).map(b => b.textContent.trim()), never: never && never.textContent } : null; });
    check('4a "Clause 7 stays here": Sara named for the one who asked, Remind Sara, Go to clause 7', S && S.h === 'Clause 7 stays here'
      && /^Your counter on the liability cap \(75%\) is with Sara Nyström for internal review\. Nothing under review travels; it goes in your next send once Sara clears it\.$/.test(S.p)
      && JSON.stringify(S.acts) === JSON.stringify(['Remind Sara', 'Go to clause 7']), JSON.stringify(S));
    check('4b "What Anna never sees"', S && S.never === 'What Anna never sees', S && S.never);
    h.mail.reset();
    await press('#pd-sendface [data-sh-lt-remind]');
    const rem = await (async () => { const t0 = Date.now(); while (Date.now() - t0 < 8000) { const m = h.mail.sent.find(x => /sara@lindqvist/.test(JSON.stringify(x.to))); if (m) return m; await pause(150); } return null; })();
    check('4c Remind Sara is the review\'s own reminder: it reaches her', !!rem, rem ? rem.subject : 'no mail to Sara');

    /* 5 sent, the same email */
    const shown = await page.evaluate(() => {
      const ps = sel => [...document.querySelectorAll(sel + ' .sh-lt-p')].map(p => p.querySelector('[data-sh-lt-btn]') ? { btn: p.textContent.trim() } : p.textContent.replace(/\s+/g, ' ').trim());
      return { subject: document.getElementById('sh-lt-subject').textContent, before: ps('#sh-lt-before'), after: ps('#sh-lt-after') }; });
    h.mail.reset();
    await press('#share-send');
    if (process.env.C2_DEBUG) { await pause(3000); console.log('DEBUG', await page.evaluate(() => ({ res: (document.getElementById('sh-result') || {}).innerText, top: [...document.querySelectorAll('[data-top-overlay]')].map(x => x.innerText).join(' | '), lbl: (document.getElementById('sh-send-lbl') || {}).textContent, toasts: [...document.querySelectorAll('.toast, [role=status]')].map(x => x.innerText).join(' | ') }))); }
    const got = await (async () => { const t0 = Date.now(); while (Date.now() - t0 < 12000) { const m = h.mail.sent.find(x => /anna\.holm/.test(JSON.stringify(x.to))); if (m) return m; await pause(150); } return null; })();
    const link = got && (/(https?:\/\/\S+)/.exec(got.text) || [])[1];
    const expect = link && (() => { const out = [shown.before.join('\n\n'), NOTE];
      let i = 0; const A = shown.after;
      while (i < A.length){ const p = A[i];
        if (p && p.btn){ out.push(`${p.btn}:\n${link}`); i++; continue; }
        if (/:$/.test(p) && A[i + 1] && !A[i + 1].btn){ const run = [p]; i++; while (i < A.length && !A[i].btn && /^Clause /.test(A[i])){ run.push(A[i]); i++; } out.push(run.join('\n')); continue; }
        out.push(p); i++; }
      return out.join('\n\n'); })();
    check('5a the provider received the subject the letter showed', got && got.subject === shown.subject, JSON.stringify({ got: got && got.subject, shown: shown.subject }));
    check('5b and its words, word for word, the real link under the button\'s words', got && !!link && got.text === expect, JSON.stringify({ got: got && got.text, expect }));
    const html = got && got.body && got.body.html;
    check('5c an HTML part whose button carries the link', typeof html === 'string' && html.includes(`href="${link}"`) && new RegExp(`>Open round ${n}</a>`).test(html), String(html).slice(0, 200));
    await page.evaluate(() => { try { closeModal(); } catch (_) {} });
    const gone = await waitFor(page, () => !document.querySelector('#modal-root .modal-in') && !document.getElementById('pd-sendface') && !!document.querySelector('#pd-redface') && !/^Send ·/.test(((document.querySelector('#dk-page .dk-page-w') || {}).textContent || '').trim()), 6000);
    check('6a closed, the page and the face go together; the Redlines face is back; the tab goes', !!gone);

    /* 6 the other ways back */
    /* RE-POINTED 18 Oct 2026 (round 11's gaps, second pass: "‹ Jambo turns
       the panel back to Jambo's own words"): ‹ Jambo leaves the letter up —
       what is typed in it kept — and "Before you send" waits as a tab that
       brings the face back; the other three ways still put both away */
    await openLetter();
    await page.fill('#sh-summary', 'Kept while Jambo talks.');
    await press('#ig-dock [data-pd-back="send"]');
    const away = await waitFor(page, () => !!document.querySelector('#modal-root .modal-in[data-sh-page] #sh-letter') && !document.getElementById('pd-sendface')
      && !!document.querySelector('#ig-dock [data-pd-send-back]') && document.getElementById('sh-summary').value === 'Kept while Jambo talks.', 6000);
    /* RE-POINTED 19 Oct 2026 (owner: "Before you send's back returns to the panel
       it came from (normally Redlines)"): the letter still waits with its note */
    check('6b the back turns the panel to where it came from; the letter stays with its note', !!away);
    await press('#ig-dock [data-pd-send-back]');
    check('6b "Before you send" is one press back', !!(await waitFor(page, () => !!document.querySelector('#pd-sendface #share-step-1'), 6000)));
    await press('#share-close');
    await waitFor(page, () => !document.querySelector('#modal-root .modal-in'), 6000);
    await page.evaluate(() => { try { closeModal(); } catch (_) {} });
    /* RE-POINTED 19 Oct 2026 (main's bar): the tab's × and the paper's tab are
       Recent's rows now — the menu is opened from the page's name first */
    for (const [how, sel] of [['Recent\'s × on the letter', '#dk-recent [data-dk-x^="send:"]'], ['Cancel', '#share-close'], ['the paper\'s Recent row', '#dk-recent [data-dk-go="c:MK-0382"]']]) {
      await openLetter();
      if (/dk-recent/.test(sel)){ await press('#dk-page'); await waitFor(page, s => !!document.querySelector(s), 3000, sel); }
      await press(sel);
      /* 22 Oct 2026: a note typed above (6b) is asked about before it goes — "Discard the note" answers it */
      await waitFor(page, () => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === 'Discard the note' && x.getClientRects().length);
        if (b) { b.click(); return true; } return !document.querySelector('#modal-root .modal-in'); }, 3000);
      const back = await waitFor(page, () => !document.querySelector('#modal-root .modal-in') && !document.getElementById('pd-sendface'), 6000);
      check(`6b ${how} puts the page and the face away together`, !!back);
    }
    /* ‹ Jambo put the Redlines face away with the letter's: open it again */
    await page.evaluate(() => { if (!document.getElementById('pd-redface')) pdRedOpen('MK-0382'); });
    await waitFor(page, () => !!document.querySelector('#pd-redface [data-nego-card]'), 8000);

    /* 6c Send all on Redlines opens the same screen (the one door): a draft of ours to send first */
    await page.evaluate(async () => { const c = getContract('MK-0382'); const k = negoClauseList(c).find(x => /reasonable skill and care/.test(String(x.text || '')));
      await negoEditClause(c, k.clauseId, '<p>The Supplier provides the logistics services described in Schedule 1 with reasonable skill and care, and to the service levels in Schedule 2.</p>', { side: 'owner', author: 'Maria Lindgren', why: 'Service levels' });
      if (window.persist) persist(c); if (window.pdRedRepaint) pdRedRepaint(); });
    await waitFor(page, () => !!document.querySelector('#pd-redface .rl-unsent-go, #pd-redface .rl-decisions-go, #pd-redface [data-redline-proxy="nego-send"]'), 6000);
    await press('#pd-redface [data-redline-proxy="nego-send"]');
    /* the review's own question first (a change is still with Sara): send the rest */
    await waitFor(page, () => { const b = [...document.querySelectorAll('#modal-root button')].find(x => /^Send the other/.test(x.textContent.trim())); if (b) { b.click(); return true; } return !!document.getElementById('sh-letter'); }, 6000);
    const viaAll = await waitFor(page, () => !!document.querySelector('#modal-root .modal-in[data-sh-page] #sh-letter') && !!document.getElementById('pd-sendface'), 8000);
    check('6c Send all on Redlines opens the same letter, beside Jambo', !!viaAll, viaAll ? null : JSON.stringify(await page.evaluate(() => ({ btn: [...document.querySelectorAll('#pd-redface .rl-idx-top button')].map(b => b.outerHTML.slice(0, 160)), modal: (document.querySelector('#modal-root') || {}).innerText, send: !!document.getElementById('nego-send') }))));
    await page.evaluate(() => { try { closeModal(); } catch (_) {} });

    /* 7 the owner's three screens */
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht }); await pause(300);
      await openLetter(); await pause(400);
      const Z = await page.evaluate(() => { const send = document.getElementById('share-send'), title = document.getElementById('share-lead-title');
        const pn = document.querySelector('#modal-root .modal-in[data-sh-page]').getBoundingClientRect(), dock = document.getElementById('ig-dock').getBoundingClientRect();
        const sr = send.getBoundingClientRect(), hit = document.elementFromPoint(sr.left + sr.width / 2, sr.top + sr.height / 2);
        const letter = document.getElementById('sh-letter').getBoundingClientRect();
        return { send: sr.top >= 0 && sr.bottom <= innerHeight && !!hit && send.contains(hit), title: title.getBoundingClientRect().top >= pn.top,
          beside: pn.right <= dock.left + 1 && letter.right <= dock.left, side: document.documentElement.scrollWidth <= innerWidth + 1 }; });
      check(`7 ${w}×${ht}: the head and Send in view, the letter beside the panel, nothing sideways`, Z.send && Z.title && Z.beside && Z.side, JSON.stringify(Z));
      await shot(page, `11-letter-${w}x${ht}`);
      await page.evaluate(() => { try { closeModal(); } catch (_) {} });
    }
  } catch (e) { check('the stage ran to the end', false, e && e.stack); }
  finally {
    check('no page errors', !errs.length, errs.slice(0, 3).join(' | '));
    await b.close(); await h.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  }
})();
