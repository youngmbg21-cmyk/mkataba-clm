/* THE SEND SCREEN IS THE LETTER (round 11 of the redesign: the owner picked
   "The letter" by name and answered "1. Keep it." — the note stays the only
   part the sender writes, 17 Oct 2026; js/sharemail.js, shareLetterPaint)

   WHAT THIS PINS, driven in a real browser against a server whose mail goes
   to a stub provider
     1 the screen draws the email: From, To (the two boxes), Subject, "Sent as"
       (what it is for, the channel, the link's settings), then its words with
       the note as the one box in them
     2 every choice redraws it: the purpose moves the subject and the
       invitation; Word attaches a file; WhatsApp has no subject; a copied
       link sends nothing
     3 what is typed is what is quoted: the name in the first line, the note
       under "Message from …" (dim while empty)
     4 SENT, IT IS THE SAME EMAIL: the provider receives the subject and the
       words the screen showed, with their real link where the mark stood
     5 "Before you send" beside it: Jambo's line, what they never see,
       something else to send (the history greys with its reason when there
       is none)
     6 the owner's three screens: the title and Send in view, the letter and
       its column side by side, nothing sideways
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/the-letter-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || '';
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const shot = async (page, name) => { if (!OUT) return; try { await page.screenshot({ path: path.join(OUT, name + '.png') }); } catch (_) {} };
const DOC = ['MASTER SERVICES AGREEMENT', '', '1. Services', '', 'The Supplier provides the logistics services in Schedule 1.', '',
  '2. Payment terms', '', 'The Customer pays each correct invoice within 30 days of receipt.'].join('\n');
const NOTE = 'We can meet you at 45 days on payment.';

(async () => {
  const h = await H.startHatiWithMail({}, { HATI_AGENTS_AUTO: 'off' });
  const W = await H.seedWorkspace(h, { contracts: [], approvalRules: [] });
  const me = (await W.admin.json('/api/bootstrap')).me;
  const c0 = H.fixtureContract('MK-0382', 'Master services agreement', 'Nordvik Logistik AB', H.FOLDER_A, 2400000, 'Draft', DOC);
  c0.owner = { id: me.id, name: me.name };
  await W.admin.json('/api/contracts/MK-0382', { method: 'PUT', body: { contract: c0, baseVersion: 0 } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-0382'), null, 20000);
    await page.keyboard.press('Escape').catch(() => {});
    const open = async () => {
      await page.evaluate(async () => { const c = getContract('MK-0382'); if (c._light && window.ensureFull) await ensureFull(c); closeModal && closeModal(); openShareModal(c); });
      return until(() => { const s = document.getElementById('share-send'); return !!document.getElementById('sh-letter') && s && !s.disabled; }, null, 10000);
    };
    const READ = () => { const L = document.getElementById('sh-letter'); if (!L) return null;
      const t = id => { const e = document.getElementById(id); return e ? e.textContent.replace(/\s+/g, ' ').trim() : null; };
      const rows = [...L.querySelectorAll('.sh-lt-row')].filter(r => r.getClientRects().length).map(r => r.querySelector('.sh-lt-k').textContent.trim());
      const ps = sel => [...L.querySelectorAll(sel + ' .sh-lt-p')].map(p => (p.querySelector('[data-sh-lt-link]') ? '{LINK}' : p.textContent.trim()));
      const mh = document.getElementById('sh-lt-msghead');
      return { rows, from: t('sh-lt-from'), subject: document.getElementById('sh-lt-subj-row').classList.contains('hidden') ? null : t('sh-lt-subject'),
        before: ps('#sh-lt-before'), after: ps('#sh-lt-after'), mh: mh && !mh.classList.contains('hidden') ? { t: mh.textContent, off: mh.classList.contains('is-off') } : null,
        noteIn: !!L.querySelector('.sh-lt-b #sh-summary'), toIn: !!L.querySelector('.sh-lt-to #sh-email') && !!L.querySelector('.sh-lt-to #sh-name'),
        asIn: !!L.querySelector('.sh-lt-as #share-purpose') && !!L.querySelector('.sh-lt-as #share-tabs'),
        file: !!L.querySelector('.sh-lt-file'), jsay: t('sh-lt-jsay') }; };
    const press = sel => page.evaluate(s => { const b = document.querySelector(s); if (!b || b.disabled) return false; b.click(); return true; }, sel);

    const ok = await open();
    check('0 the send screen opens and is wired', !!ok);
    /* photographed once the dialog's entry has run (a photo mid-fade shows the page through it) */
    await until(() => { const p = document.querySelector('#modal-root .modal-in'); return !!p && !(p.getAnimations && p.getAnimations().some(a => a.playState === 'running')); });
    await shot(page, 'the-letter-1440x780');

    /* 1 the email, drawn */
    const R1 = await page.evaluate(READ);
    check('1a the letter\'s head: From, To, Subject, Sent as', R1 && JSON.stringify(R1.rows) === JSON.stringify(['From', 'To', 'Subject', 'Sent as']), JSON.stringify(R1 && R1.rows));
    check('1b the two boxes are its To row, the purpose and the channel its "Sent as", the note a box in its words', R1 && R1.toIn && R1.asIn && R1.noteIn, JSON.stringify(R1 && { to: R1.toIn, as: R1.asIn, note: R1.noteIn }));
    check('1c From names the sender and the workspace', R1 && R1.from && R1.from.startsWith(me.name + ' at ') && /sent through HaTi$/.test(R1.from), R1 && R1.from);

    /* 3 typed is quoted */
    await page.fill('#sh-name', 'Anna Holm'); await page.fill('#sh-email', 'anna.holm@nordvik.example');
    const R2a = await page.evaluate(READ);
    check('3a an empty note sends nothing, so its heading is dim', R2a && R2a.mh && R2a.mh.off && /^Message from /.test(R2a.mh.t), JSON.stringify(R2a && R2a.mh));
    await page.fill('#sh-summary', NOTE);
    const R2 = await page.evaluate(READ);
    check('3b the name is in the first line, as the email writes it', R2 && /with you for review, Anna Holm\.$/.test(R2.before[0] || ''), JSON.stringify(R2 && R2.before));
    check('3c with a note the heading over it lights', R2 && R2.mh && !R2.mh.off && R2.mh.t === `Message from ${me.name}:`, JSON.stringify(R2 && R2.mh));
    check('3d Jambo says it is word for word, and the note is the only part written', R2 && /This is the email Anna will get, word for word\. Your note is the only part you write\./.test(R2.jsay || ''), R2 && R2.jsay);

    /* 2 every choice redraws it */
    await press('[data-share-purpose="negotiate"]');
    const RN = await page.evaluate(READ);
    check('2a Negotiate: the subject and the invitation say negotiate', RN && /sent you "Master services agreement" to negotiate$/.test(RN.subject || '') && RN.after.some(p => /^Open the link to work through the proposed changes/.test(p)), JSON.stringify(RN && { s: RN.subject, a: RN.after }));
    await press('[data-share-purpose="view"]');
    const RV = await page.evaluate(READ);
    check('2b View: the review subject and its invitation', RV && /shared "Master services agreement" for your review$/.test(RV.subject || '') && RV.after.some(p => /^Open the contract to review it/.test(p)), JSON.stringify(RV && RV.subject));
    const hasWord = await press('[data-share-ch="word"]');
    if (hasWord) {
      const RW = await page.evaluate(READ);
      check('2c Word: "to mark up", the file attached, no link mark', RW && /to mark up$/.test(RW.subject || '') && RW.file && !RW.after.includes('{LINK}'), JSON.stringify(RW && { s: RW.subject, f: RW.file, a: RW.after }));
    } else check('2c Word: the channel is offered on a server', false, 'no Word segment');
    await press('[data-share-ch="whatsapp"]');
    const RWA = await page.evaluate(READ);
    check('2d WhatsApp: no subject, From says WhatsApp, the message keeps the note out of the paragraphs', RWA && RWA.subject === null && /WhatsApp/.test(RWA.from || '') && !RWA.mh, JSON.stringify(RWA && { s: RWA.subject, f: RWA.from, mh: RWA.mh }));
    await press('[data-share-ch="link"]');
    const RL = await page.evaluate(READ);
    check('2e Copy link: the letter says nothing is sent', RL && RL.subject === null && /^Nothing is sent from here/.test(RL.before[0] || ''), JSON.stringify(RL && RL.before));
    await press('[data-share-ch="email"]'); await press('[data-share-purpose="negotiate"]');

    /* 5 before you send */
    const S = await page.evaluate(() => { const side = document.getElementById('share-step-1'), L = document.getElementById('sh-letter');
      const cards = [...side.querySelectorAll('.sh-lt-card h4')].map(x => x.textContent.trim());
      const hist = document.getElementById('share-other'), st = document.querySelector('[data-sh-lt-else="status"]');
      const a = L.getBoundingClientRect(), b = side.getBoundingClientRect();
      return { head: (side.querySelector('.sh-lt-jb') || {}).textContent, cards, histOff: !!(hist && hist.disabled && hist.title), status: !!(st && !st.disabled),
        beside: b.left >= a.right - 1 && b.top < a.bottom }; });
    check('5a "Before you send" stands beside the letter', S && /Before you send/.test(S.head || '') && S.beside, JSON.stringify(S));
    check('5b what they never see, and something else to send', S && S.cards.includes('What Nordvik Logistik AB never sees') && S.cards.includes('Something else to send?'), JSON.stringify(S && S.cards));
    check('5c nothing proposed yet: the history greys with its reason; the Where we are page is offered', S && S.histOff && S.status, JSON.stringify(S));

    /* 4 sent, the same email */
    const shown = await page.evaluate(READ);
    h.mail.reset();
    await press('#share-send');
    const got = await (async () => { const t0 = Date.now(); while (Date.now() - t0 < 10000) { if (h.mail.sent.length) return h.mail.sent[h.mail.sent.length - 1]; await page.waitForTimeout(150); } return null; })();
    const link = got && (/(https?:\/\/\S+)/.exec(got.text) || [])[1];
    const expect = shown && shown.mh && link && (() => {
      /* the server's joins (js/sharemail.js): a blank line between parts, the
         note under its heading, the link under the invitation */
      const after = []; for (let i = 0; i < shown.after.length; i++){ const p = shown.after[i];
        if (shown.after[i + 1] === '{LINK}'){ after.push(`${p}\n${link}`); i++; } else after.push(p); }
      return [shown.before.join('\n\n'), `${shown.mh.t}\n${NOTE}`, ...after].join('\n\n'); })();
    check('4a the provider received the subject the letter showed', got && shown && got.subject === shown.subject, JSON.stringify({ got: got && got.subject, shown: shown && shown.subject }));
    check('4b and its words, word for word, their real link where the mark stood', got && !!link && got.text === expect, JSON.stringify({ got: got && got.text, expect }));
    await page.evaluate(() => { try { closeModal(); } catch (_) {} });

    /* 6 the owner's three screens */
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht }); await open();
      await until(() => { const p = document.querySelector('#modal-root .modal-in'); return !!p && !(p.getAnimations && p.getAnimations().some(a => a.playState === 'running')); });
      const F = await page.evaluate(() => { const t = document.getElementById('share-lead-title'), s = document.getElementById('share-send'), L = document.getElementById('sh-letter'), side = document.getElementById('share-step-1');
        const tr = t.getBoundingClientRect(), sr = s.getBoundingClientRect(), a = L.getBoundingClientRect(), b = side.getBoundingClientRect();
        const hit = document.elementFromPoint(sr.left + sr.width / 2, sr.top + sr.height / 2);
        return { title: tr.top >= 0 && tr.bottom <= innerHeight, send: sr.bottom <= innerHeight && sr.top >= 0 && !!hit && s.contains(hit), beside: b.left >= a.right - 1, side: document.documentElement.scrollWidth <= innerWidth + 1 }; });
      check(`6 ${w}×${ht}: the title and Send in view, the letter and its column side by side, nothing sideways`, F.title && F.send && F.beside && F.side, JSON.stringify(F));
      await shot(page, `the-letter-${w}x${ht}`);
      await page.evaluate(() => { try { closeModal(); } catch (_) {} });
    }
  } catch (e) { check('the stage ran to the end', false, e && e.stack); }
  finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  }
})();
