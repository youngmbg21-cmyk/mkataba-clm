/* THE SUBJECT IS YOURS TO CHANGE, AND JAMBO WRITES THE NOTE (owner, 29 Oct 2026: on MK-382's send screen
   Jambo, asked to "draft an email to send the redlines", wrote a second whole email in the chat — its own
   subject, a [placeholder], a change that was not in the round — and the subject could not be changed)

   WHAT THIS PINS, driven in a real browser against a server whose mail goes to a stub provider
     1 the Subject is a box holding HaTi's subject; what is typed there is the subject the provider receives,
       and it stays through a repaint (another purpose chosen); emptied, HaTi's stands again
     2 where HaTi writes the whole message (WhatsApp) there is no subject to type
     3 Jambo is told what the screen holds (aiPageContext → page.sending): who, the subject, what this send
       carries as the email lists it, the note as it stands — and the sentence the model reads says so
     4 his note is quoted under his answer with ONE press; the press fills the note box and the letter, and
       sends nothing; a note longer than the box holds is said, with no press; with the screen shut, nothing
     5 the owner's three screens: the subject box is on screen, pressable, inside its row
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/subject-and-jambo-note-verify.js */
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
const SUBJ = 'Our redlines on the services agreement';
const NOTE = 'Thanks for your patience. We have proposed changes to payment terms; the rest stands as you sent it.';

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
      const ok = await until(() => { const s = document.getElementById('share-send'); return !!document.getElementById('sh-letter') && s && !s.disabled; }, null, 10000);
      await until(() => { const p = document.querySelector('#modal-root .modal-in'); return !!p && !(p.getAnimations && p.getAnimations().some(a => a.playState === 'running')); });
      return ok;
    };
    const press = sel => page.evaluate(s => { const b = document.querySelector(s); if (!b || b.disabled) return false; b.click(); return true; }, sel);
    const subj = () => page.evaluate(() => { const el = document.getElementById('sh-lt-subject'), row = document.getElementById('sh-lt-subj-row');
      return el ? { v: el.value, ro: el.readOnly, tag: el.tagName, shown: !!row && !row.classList.contains('hidden') } : null; });

    check('0 the send screen opens', !!(await open()));
    await page.fill('#sh-name', 'Anna Holm'); await page.fill('#sh-email', 'anna.holm@nordvik.example');
    await press('[data-share-purpose="negotiate"]');

    /* 1 the subject box */
    const S0 = await subj();
    check('1a the Subject is a box holding HaTi\'s own subject', S0 && S0.tag === 'INPUT' && !S0.ro && S0.shown && /^Round 1 of the Master services agreement, from /.test(S0.v), JSON.stringify(S0));
    await page.fill('#sh-lt-subject', SUBJ);
    await press('[data-share-purpose="view"]'); await press('[data-share-purpose="negotiate"]');
    const S1 = await subj();
    check('1b what is typed stays through a repaint', S1 && S1.v === SUBJ, JSON.stringify(S1));
    await page.fill('#sh-lt-subject', '');
    await press('[data-share-purpose="view"]'); await press('[data-share-purpose="negotiate"]');
    const S2 = await subj();
    check('1c emptied, HaTi\'s subject stands again', S2 && /^Round 1 of /.test(S2.v), JSON.stringify(S2));

    /* 2 WhatsApp: no subject to type */
    await press('[data-share-ch="whatsapp"]');
    const SW = await subj();
    check('2 WhatsApp carries no subject, so none is offered', SW && !SW.shown, JSON.stringify(SW));
    await press('[data-share-ch="email"]'); await press('[data-share-purpose="negotiate"]');

    /* 3 Jambo knows the screen */
    await page.fill('#sh-lt-subject', SUBJ);
    const P = await page.evaluate(() => { const p = aiPageContext(); return { s: p && p.sending, says: aiPageSays(p || {}) }; });
    check('3a the page Jambo is told about carries the send screen', P.s && P.s.contract && P.s.to === 'Anna Holm' && P.s.subject === SUBJ && Array.isArray(P.s.goes) && P.s.note === '', JSON.stringify(P.s));
    check('3b the sentence he reads says HaTi writes the email, and under which subject', /The send screen is open for .*HaTi writes the email to Anna Holm by email itself, under the subject "Our redlines on the services agreement"/.test(P.says) && /The note box is empty\./.test(P.says), P.says);

    /* 4 his note, one press */
    const D = await page.evaluate(n => { const host = document.createElement('div'); host.id = 'jb-note-probe'; host.innerHTML = aiSendNoteHtml(n); document.body.appendChild(host);
      const b = host.querySelector('[data-ai-send-note]'), q = host.querySelector('.ai-send-note-q');
      return { btn: b && b.textContent.trim(), quote: q && q.textContent.trim() }; }, NOTE);
    check('4a his note is quoted under his answer, with Put this in the note', D.btn === 'Put this in the note' && D.quote === NOTE, JSON.stringify(D));
    h.mail.reset();
    await press('#jb-note-probe [data-ai-send-note]');
    const F = await until(n => { const ta = document.getElementById('sh-summary'); return ta && ta.value === n ? { v: ta.value,
      letter: document.getElementById('sh-letter').textContent.includes(n) || ta.value === n } : null; }, NOTE);
    await page.waitForTimeout(400);
    check('4b the press fills the note box', F && F.v === NOTE, JSON.stringify(F));
    check('4c and sends nothing', h.mail.sent.length === 0, String(h.mail.sent.length));
    const P2 = await page.evaluate(() => aiPageContext().sending.note);
    check('4d Jambo now reads the note as it stands', P2 === NOTE, P2);
    const LONG = await page.evaluate(() => { const el = document.createElement('div'); el.innerHTML = aiSendNoteHtml('x'.repeat(1200));
      return { btn: !!el.querySelector('[data-ai-send-note]'), cap: (el.querySelector('.ai-send-note-cap') || {}).textContent || '' }; });
    check('4e a note past what the box holds is said, with no press', !LONG.btn && /1200 characters; the note box holds 1000/.test(LONG.cap), JSON.stringify(LONG));
    await page.evaluate(() => document.getElementById('jb-note-probe').remove());

    /* 1d sent: the typed subject is the subject mailed */
    h.mail.reset();
    await press('#share-send');
    const got = await (async () => { const t0 = Date.now(); while (Date.now() - t0 < 10000) { if (h.mail.sent.length) return h.mail.sent[h.mail.sent.length - 1]; await page.waitForTimeout(150); } return null; })();
    check('1d the provider received the subject that was typed', got && got.subject === SUBJ, JSON.stringify(got && got.subject));
    check('1e and the note Jambo wrote, in its words', got && got.text.includes(NOTE), got && got.text);
    await page.evaluate(() => { try { closeModal(); } catch (_) {} });
    const gone = await page.evaluate(n => aiSendNoteHtml(n), NOTE);
    check('4f with the send screen shut, no note and no press is drawn', gone === '', gone);

    /* 5 the owner's three screens */
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht }); await open();
      /* Anna is remembered from the send above: To is her chip now */
      await page.evaluate(() => { const el = document.getElementById('sh-lt-subject'); el.scrollIntoView({ block: 'center' }); });
      await page.fill('#sh-lt-subject', SUBJ);
      const G = await page.evaluate(() => { const el = document.getElementById('sh-lt-subject'), row = document.getElementById('sh-lt-subj-row');
        const r = el.getBoundingClientRect(), rr = row.getBoundingClientRect(), hit = document.elementFromPoint(r.left + 20, r.top + r.height / 2);
        return { hit: hit === el, inside: r.left >= rr.left - 0.5 && r.right <= rr.right + 0.5, oneLine: r.height < 60, side: document.documentElement.scrollWidth <= innerWidth + 1 }; });
      check(`5 ${w}×${ht}: the subject box is on screen, pressable, inside its row, nothing sideways`, G.hit && G.inside && G.oneLine && G.side, JSON.stringify(G));
      await shot(page, `subject-box-${w}x${ht}`);
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
